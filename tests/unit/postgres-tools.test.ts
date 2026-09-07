import { describe, expect, it } from 'vitest'

import {
  databaseUrlForName,
  pgDumpInvocation,
  pgRestoreInvocation,
  pgCreateDatabaseInvocation,
  pgDropDatabaseInvocation,
  pgCountTablesInvocation,
  parsePostgresToolConfig,
  redactPostgresError,
  validatePostgresIdentifier,
} from '@/modules/operations/postgres-tools'

describe('PostgreSQL maintenance tool boundary', () => {
  it.each(['dbname=continuum', '%64bname=continuum', 'dbname=first&dbname=continuum', 'service=production',
    'options=-c%20search_path%3Dpublic', 'host=other-server', 'hostaddr=10.0.0.1', 'port=5433',
    'user=other-owner', 'password=other-password', 'unknown_option=x', 'sslmode=require&sslmode=disable'])
  ('rejects direct URI connection overrides before any invocation: %s', (query) => {
    const databaseUrl = `postgres://continuum:secret@db:5432/continuum?${query}`
    expect(() => parsePostgresToolConfig({ CONTINUUM_BACKUP_MODE: 'direct', DATABASE_URL: databaseUrl })).toThrow('maintenance')
    expect(() => databaseUrlForName(databaseUrl, 'continuum_restore_1234_ab12cd34')).toThrow('maintenance')
    const config = { mode: 'direct' as const, databaseUrl }
    expect(() => pgDumpInvocation(config)).toThrow('maintenance')
    for (const invocation of [pgRestoreInvocation, pgCreateDatabaseInvocation, pgDropDatabaseInvocation, pgCountTablesInvocation]) {
      expect(() => invocation(config, 'continuum_restore_1234_ab12cd34')).toThrow('maintenance')
    }
  })
  it.each(['PGSERVICE', 'PGSERVICEFILE', 'PGSYSCONFDIR', 'PGOPTIONS', 'PGDATABASE', 'PGHOST', 'PGHOSTADDR', 'PGPORT', 'PGUSER'])('rejects implicit %s maintenance configuration', (name) => {
    expect(() => parsePostgresToolConfig({ CONTINUUM_BACKUP_MODE: 'direct',
      DATABASE_URL: 'postgres://continuum:secret@db:5432/continuum', [name]: 'unexpected-override' })).toThrow('maintenance')
  })
  it.each(['postgres:///continuum', 'postgres://db/continuum', 'postgres://continuum@db/',
    'postgres://continuum@db/continuum#dbname=live', 'postgres://continuum@db/continuum%00'])
  ('requires explicit unambiguous direct connection identity: %s', (databaseUrl) => {
    expect(() => parsePostgresToolConfig({ CONTINUUM_BACKUP_MODE: 'direct', DATABASE_URL: databaseUrl })).toThrow('maintenance')
  })
  it('preserves only reviewed TLS, timeout and application-name options when selecting the isolated database', () => {
    const query = 'sslmode=verify-full&sslrootcert=%2Fcerts%2Froot.pem&sslcert=%2Fcerts%2Fclient.pem&sslkey=%2Fcerts%2Fclient.key&connect_timeout=10&application_name=continuum-maintenance&channel_binding=require'
    const result = databaseUrlForName(`postgres://continuum:secret@db:5432/continuum?${query}`, 'continuum_restore_1234_ab12cd34')
    expect(new URL(result).pathname).toBe('/continuum_restore_1234_ab12cd34')
    expect(new URL(result).searchParams.toString()).toBe(query)
  })
  it('rejects live database names for every restore-drill action in Docker mode too', () => {
    const config = { mode: 'docker' as const, container: 'continuum-db', database: 'continuum_test', user: 'continuum' }
    for (const invocation of [pgRestoreInvocation, pgCreateDatabaseInvocation, pgDropDatabaseInvocation, pgCountTablesInvocation]) {
      expect(() => invocation(config, 'continuum')).toThrow('restore')
      expect(() => invocation(config, 'continuum_test')).toThrow('restore')
    }
  })
  it('pins pg_dump to an exported snapshot and rejects option-like snapshot IDs', () => {
    const config = { mode: 'docker' as const, container: 'continuum-db', database: 'continuum_test', user: 'continuum' }
    expect(pgDumpInvocation(config, '00000003-0000004A-1').args).toContain('--snapshot=00000003-0000004A-1')
    expect(() => pgDumpInvocation(config, '--help')).toThrow('snapshot')
  })
  it('uses explicit Docker execution only when a safe container is configured', () => {
    expect(parsePostgresToolConfig({
      DATABASE_URL: 'postgres://continuum:secret@db:5432/continuum',
      CONTINUUM_BACKUP_CONTAINER: 'continuum-db',
      CONTINUUM_BACKUP_DB: 'continuum',
      CONTINUUM_BACKUP_USER: 'continuum',
    })).toEqual({ mode: 'docker', container: 'continuum-db', database: 'continuum', user: 'continuum' })

    expect(() => parsePostgresToolConfig({
      DATABASE_URL: 'postgres://continuum:secret@db:5432/continuum',
      CONTINUUM_BACKUP_CONTAINER: '--privileged',
    })).toThrow('container')
  })

  it('uses the PostgreSQL URL directly inside a maintenance container', () => {
    const config = parsePostgresToolConfig({
      DATABASE_URL: 'postgres://continuum:secret@db:5432/continuum?sslmode=disable',
      CONTINUUM_BACKUP_MODE: 'direct',
    })
    expect(config).toEqual({ mode: 'direct', databaseUrl: 'postgres://continuum:secret@db:5432/continuum?sslmode=disable' })
    expect(pgDumpInvocation(config)).toEqual({
      command: 'pg_dump',
      args: ['--dbname', 'postgres://continuum:secret@db:5432/continuum?sslmode=disable', '--format=custom', '--no-owner', '--no-privileges'],
    })
  })

  it('preserves the existing host default of the local continuum-db container', () => {
    expect(parsePostgresToolConfig({
      DATABASE_URL: 'postgres://continuum:secret@127.0.0.1:55432/continuum',
    })).toEqual({ mode: 'docker', container: 'continuum-db', database: 'continuum', user: 'continuum' })
  })

  it('builds Docker and direct restore invocations without a shell command string', () => {
    expect(pgDumpInvocation({ mode: 'docker', container: 'continuum-db', database: 'continuum', user: 'continuum' })).toEqual({
      command: 'docker',
      args: ['exec', 'continuum-db', 'pg_dump', '--username', 'continuum', '--dbname', 'continuum', '--format=custom', '--no-owner', '--no-privileges'],
    })
    expect(pgRestoreInvocation(
      { mode: 'direct', databaseUrl: 'postgres://continuum:secret@db:5432/continuum' },
      'continuum_restore_1234_ab12cd34',
    )).toEqual({
      command: 'pg_restore',
      args: ['--dbname', 'postgres://continuum:secret@db:5432/continuum_restore_1234_ab12cd34', '--exit-on-error', '--no-owner', '--no-privileges'],
    })
  })

  it('replaces only the database name for an isolated restore drill', () => {
    expect(databaseUrlForName(
      'postgres://continuum:secret@db:5432/continuum?sslmode=disable',
      'continuum_restore_1234_ab12cd34',
    )).toBe('postgres://continuum:secret@db:5432/continuum_restore_1234_ab12cd34?sslmode=disable')
    expect(() => databaseUrlForName('postgres://continuum:secret@db/continuum', 'postgres')).toThrow('restore')
  })

  it('accepts only bounded PostgreSQL identifiers', () => {
    expect(validatePostgresIdentifier('continuum_owner', 'user')).toBe('continuum_owner')
    expect(() => validatePostgresIdentifier('-Uroot', 'user')).toThrow('user')
    expect(() => validatePostgresIdentifier('name;drop', 'database')).toThrow('database')
  })

  it('redacts database credentials before a restore failure is persisted', () => {
    const databaseUrl = 'postgres://continuum:super-secret@db:5432/continuum'
    const message = redactPostgresError(`Command failed: pg_restore --dbname ${databaseUrl}`, databaseUrl)

    expect(message).toContain('[DATABASE_URL]')
    expect(message).not.toContain('super-secret')
  })
})
