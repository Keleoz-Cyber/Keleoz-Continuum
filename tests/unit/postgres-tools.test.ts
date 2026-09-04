import { describe, expect, it } from 'vitest'

import {
  databaseUrlForName,
  pgDumpInvocation,
  pgRestoreInvocation,
  parsePostgresToolConfig,
  redactPostgresError,
  validatePostgresIdentifier,
} from '@/modules/operations/postgres-tools'

describe('PostgreSQL maintenance tool boundary', () => {
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
