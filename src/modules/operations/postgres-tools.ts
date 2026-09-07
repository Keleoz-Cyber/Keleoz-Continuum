export type PostgresToolConfig =
  | { mode: 'docker'; container: string; database: string; user: string }
  | { mode: 'direct'; databaseUrl: string }

export type CommandInvocation = { command: string; args: string[] }

function validateContainer(value: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(value)) {
    throw new Error('Invalid PostgreSQL container name')
  }
  return value
}

export function validatePostgresIdentifier(value: string, label: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(value)) {
    throw new Error(`Invalid PostgreSQL ${label}`)
  }
  return value
}

function validateDatabaseUrl(value: string | undefined): string {
  if (!value) throw new Error('DATABASE_URL is required for direct PostgreSQL maintenance')
  try {
    const url = new URL(value)
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') throw new Error('protocol')
    // libpq query fields override URI authority/path fields. Keep a small reviewed
    // allowlist so dbname, service, options, hostaddr and future fields fail closed.
    const allowed = new Set(['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'connect_timeout', 'application_name', 'channel_binding'])
    const seen = new Set<string>()
    for (const [key, parameter] of url.searchParams) {
      if (!allowed.has(key) || seen.has(key) || /[\u0000-\u001f\u007f]/.test(parameter)) throw new Error('parameter')
      seen.add(key)
    }
    if (!url.hostname || !url.username || url.hash || /[\u0000-\u0020\u007f]/.test(value) ||
      !/^\/[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(decodeURIComponent(url.pathname))) throw new Error('identity')
    return url.toString()
  } catch {
    throw new Error('Unsafe PostgreSQL maintenance URL: require explicit postgres:// user, host and database; only unique TLS, timeout and application-name query options are supported')
  }
}

export function parsePostgresToolConfig(source: Record<string, string | undefined>): PostgresToolConfig {
  const mode = source.CONTINUUM_BACKUP_MODE?.trim() || 'docker'
  if (mode === 'docker') {
    const container = source.CONTINUUM_BACKUP_CONTAINER?.trim() || 'continuum-db'
    return {
      mode: 'docker',
      container: validateContainer(container),
      database: validatePostgresIdentifier(source.CONTINUUM_BACKUP_DB?.trim() || 'continuum', 'database'),
      user: validatePostgresIdentifier(source.CONTINUUM_BACKUP_USER?.trim() || 'continuum', 'user'),
    }
  }
  if (mode !== 'direct') throw new Error('CONTINUUM_BACKUP_MODE must be docker or direct')
  for (const name of ['PGSERVICE', 'PGSERVICEFILE', 'PGSYSCONFDIR', 'PGOPTIONS', 'PGDATABASE', 'PGHOST', 'PGHOSTADDR', 'PGPORT', 'PGUSER']) {
    if (source[name]) throw new Error(`PostgreSQL maintenance does not permit implicit ${name} overrides; use an explicit DATABASE_URL`)
  }
  return { mode: 'direct', databaseUrl: validateDatabaseUrl(source.DATABASE_URL) }
}

export function databaseUrlForName(databaseUrl: string, databaseName: string): string {
  if (!/^continuum_restore_\d+_[a-f0-9]{8}$/.test(databaseName)) {
    throw new Error('Unsafe restore database name')
  }
  const url = new URL(validateDatabaseUrl(databaseUrl))
  url.pathname = `/${databaseName}`
  return url.toString()
}

export function pgDumpInvocation(config: PostgresToolConfig, snapshot?: string): CommandInvocation {
  if (snapshot !== undefined && !/^[a-fA-F0-9]+-[a-fA-F0-9]+-[0-9]+$/.test(snapshot)) throw new Error('Invalid PostgreSQL snapshot ID')
  const snapshotArgs = snapshot ? [`--snapshot=${snapshot}`] : []
  if (config.mode === 'docker') {
    return {
      command: 'docker',
      args: ['exec', config.container, 'pg_dump', '--username', config.user, '--dbname', config.database, '--format=custom', '--no-owner', '--no-privileges', ...snapshotArgs],
    }
  }
  return {
    command: 'pg_dump',
    args: ['--dbname', validateDatabaseUrl(config.databaseUrl), '--format=custom', '--no-owner', '--no-privileges', ...snapshotArgs],
  }
}

export function pgRestoreInvocation(config: PostgresToolConfig, databaseName: string): CommandInvocation {
  assertRestoreDatabaseName(databaseName)
  if (config.mode === 'docker') {
    validatePostgresIdentifier(databaseName, 'restore database')
    return {
      command: 'docker',
      args: ['exec', '-i', config.container, 'pg_restore', '--username', config.user, '--dbname', databaseName, '--exit-on-error', '--no-owner', '--no-privileges'],
    }
  }
  return {
    command: 'pg_restore',
    args: ['--dbname', databaseUrlForName(config.databaseUrl, databaseName), '--exit-on-error', '--no-owner', '--no-privileges'],
  }
}

export function pgCreateDatabaseInvocation(config: PostgresToolConfig, databaseName: string): CommandInvocation {
  assertRestoreDatabaseName(databaseName)
  validatePostgresIdentifier(databaseName, 'restore database')
  return config.mode === 'docker'
    ? { command: 'docker', args: ['exec', config.container, 'createdb', '--username', config.user, databaseName] }
    : { command: 'createdb', args: ['--maintenance-db', validateDatabaseUrl(config.databaseUrl), databaseName] }
}

export function pgCountTablesInvocation(config: PostgresToolConfig, databaseName: string): CommandInvocation {
  assertRestoreDatabaseName(databaseName)
  const statement = "select count(*) from information_schema.tables where table_schema='public'"
  validatePostgresIdentifier(databaseName, 'restore database')
  return config.mode === 'docker'
    ? { command: 'docker', args: ['exec', config.container, 'psql', '--username', config.user, '--dbname', databaseName, '--tuples-only', '--no-align', '--command', statement] }
    : { command: 'psql', args: ['--dbname', databaseUrlForName(config.databaseUrl, databaseName), '--tuples-only', '--no-align', '--command', statement] }
}

export function pgDropDatabaseInvocation(config: PostgresToolConfig, databaseName: string): CommandInvocation {
  assertRestoreDatabaseName(databaseName)
  validatePostgresIdentifier(databaseName, 'restore database')
  return config.mode === 'docker'
    ? { command: 'docker', args: ['exec', config.container, 'dropdb', '--username', config.user, '--if-exists', databaseName] }
    : { command: 'dropdb', args: ['--maintenance-db', validateDatabaseUrl(config.databaseUrl), '--if-exists', databaseName] }
}

export function redactPostgresError(message: string, databaseUrl?: string): string {
  return (databaseUrl ? message.replaceAll(databaseUrl, '[DATABASE_URL]') : message).slice(0, 400)
}

function assertRestoreDatabaseName(databaseName: string) {
  if (!/^continuum_restore_\d+_[a-f0-9]{8}$/.test(databaseName)) throw new Error('Unsafe restore database name')
}
