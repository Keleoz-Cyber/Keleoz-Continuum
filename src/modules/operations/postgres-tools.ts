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
    return value
  } catch {
    throw new Error('DATABASE_URL must use postgres:// or postgresql://')
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

export function pgDumpInvocation(config: PostgresToolConfig): CommandInvocation {
  if (config.mode === 'docker') {
    return {
      command: 'docker',
      args: ['exec', config.container, 'pg_dump', '--username', config.user, '--dbname', config.database, '--format=custom', '--no-owner', '--no-privileges'],
    }
  }
  return {
    command: 'pg_dump',
    args: ['--dbname', config.databaseUrl, '--format=custom', '--no-owner', '--no-privileges'],
  }
}

export function pgRestoreInvocation(config: PostgresToolConfig, databaseName: string): CommandInvocation {
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
  validatePostgresIdentifier(databaseName, 'restore database')
  return config.mode === 'docker'
    ? { command: 'docker', args: ['exec', config.container, 'createdb', '--username', config.user, databaseName] }
    : { command: 'createdb', args: ['--maintenance-db', config.databaseUrl, databaseName] }
}

export function pgCountTablesInvocation(config: PostgresToolConfig, databaseName: string): CommandInvocation {
  const statement = "select count(*) from information_schema.tables where table_schema='public'"
  validatePostgresIdentifier(databaseName, 'restore database')
  return config.mode === 'docker'
    ? { command: 'docker', args: ['exec', config.container, 'psql', '--username', config.user, '--dbname', databaseName, '--tuples-only', '--no-align', '--command', statement] }
    : { command: 'psql', args: ['--dbname', databaseUrlForName(config.databaseUrl, databaseName), '--tuples-only', '--no-align', '--command', statement] }
}

export function pgDropDatabaseInvocation(config: PostgresToolConfig, databaseName: string): CommandInvocation {
  validatePostgresIdentifier(databaseName, 'restore database')
  return config.mode === 'docker'
    ? { command: 'docker', args: ['exec', config.container, 'dropdb', '--username', config.user, '--if-exists', databaseName] }
    : { command: 'dropdb', args: ['--maintenance-db', config.databaseUrl, '--if-exists', databaseName] }
}

export function redactPostgresError(message: string, databaseUrl?: string): string {
  return (databaseUrl ? message.replaceAll(databaseUrl, '[DATABASE_URL]') : message).slice(0, 400)
}
