import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { pipeline } from 'node:stream/promises'
import { databaseUrlForName, type CommandInvocation, type PostgresToolConfig } from './postgres-tools'
import { assertNoSymlinkPath, validateMediaBackupKey } from './media-backup'

const MEDIA_KEYS_SQL = `select to_json(storage_key)::text from (
  select storage_key from media_objects where state='ready'
  union select v.storage_key from media_variants v join media_objects m on m.id=v.media_id where m.state='ready'
) required_media order by storage_key`

function psql(config: PostgresToolConfig, databaseName?: string): CommandInvocation {
  if (databaseName && !/^continuum_restore_\d+_[a-f0-9]{8}$/.test(databaseName)) throw new Error('Unsafe restore database name')
  const args = ['-X', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1']
  return config.mode === 'docker'
    ? { command: 'docker', args: ['exec', '-i', config.container, 'psql', '--username', config.user, '--dbname', databaseName ?? config.database, ...args] }
    : { command: 'psql', args: ['--dbname', databaseName ? databaseUrlForName(config.databaseUrl, databaseName) : config.databaseUrl, ...args] }
}

function launch(invocation: CommandInvocation) {
  const child = spawn(invocation.command, invocation.args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  // Do not persist stderr, which can include database connection credentials.
  child.stderr.resume()
  child.stdin.on('error', () => { /* Process completion reports pipe failures. */ })
  const completed = new Promise<void>((resolve, reject) => {
    child.once('error', () => reject(new Error('PostgreSQL maintenance command could not start')))
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error(`PostgreSQL maintenance command failed (exit ${code})`)))
  })
  void completed.catch(() => {})
  return { child, completed }
}

export async function runPostgresCommand(invocation: CommandInvocation, options: { inputFile?: string; outputFile?: string } = {}): Promise<string> {
  if (options.inputFile) await assertNoSymlinkPath(options.inputFile)
  if (options.outputFile) await assertNoSymlinkPath(options.outputFile)
  const { child, completed } = launch(invocation)
  let result = ''
  let total = 0
  const streams: Promise<unknown>[] = []
  if (options.inputFile) streams.push(pipeline(createReadStream(options.inputFile), child.stdin))
  else child.stdin.end()
  if (options.outputFile) streams.push(pipeline(child.stdout, createWriteStream(options.outputFile, { flags: 'wx', mode: 0o600 })))
  else streams.push((async () => {
    for await (const chunk of child.stdout) {
      total += chunk.length
      if (total > 64 * 1024 * 1024) throw new Error('PostgreSQL maintenance output exceeds 64 MiB limit')
      result += chunk.toString('utf8')
    }
  })())
  try {
    await Promise.all([...streams, completed])
    return result
  } catch (error) {
    child.kill()
    await Promise.allSettled([...streams, completed])
    throw error
  }
}

export async function withPostgresMediaSnapshot<T>(config: PostgresToolConfig, operation: (snapshot: { snapshotId: string; keys: string[] }) => Promise<T>): Promise<T> {
  const { child, completed } = launch(psql(config))
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity })
  child.stdin.write(`BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\nSELECT pg_export_snapshot();\n${MEDIA_KEYS_SQL};\n\\echo CONTINUUM_SNAPSHOT_READY\n`)
  let snapshotId = ''
  const keys: string[] = []
  let ready = false
  try {
    for await (const line of lines) {
      if (!snapshotId) {
        if (!/^[a-fA-F0-9]+-[a-fA-F0-9]+-[0-9]+$/.test(line)) throw new Error('Invalid exported PostgreSQL snapshot')
        snapshotId = line
      } else if (line === 'CONTINUUM_SNAPSHOT_READY') { ready = true; break }
      else {
        if (line.length > 1024 || keys.length >= 100_000) throw new Error('Media inventory exceeds bounded backup limit')
        keys.push(validateMediaBackupKey(JSON.parse(line) as string))
      }
    }
    if (!ready) throw new Error('PostgreSQL snapshot inventory was not completed')
    const result = await operation({ snapshotId, keys })
    child.stdin.end('COMMIT;\n\\quit\n')
    await completed
    return result
  } catch (error) {
    child.stdin.end('ROLLBACK;\n\\quit\n')
    child.kill()
    await completed.catch(() => {})
    throw error
  } finally { lines.close() }
}

export async function readRestoredMediaKeys(config: PostgresToolConfig, databaseName: string): Promise<string[]> {
  const invocation = psql(config, databaseName)
  const raw = await runPostgresCommand({ ...invocation, args: [...invocation.args, '--command', MEDIA_KEYS_SQL] })
  const keys = raw.trim() ? raw.trim().split(/\r?\n/).map((line) => validateMediaBackupKey(JSON.parse(line) as string)) : []
  if (keys.length > 100_000) throw new Error('Media inventory exceeds bounded backup limit')
  return keys
}
