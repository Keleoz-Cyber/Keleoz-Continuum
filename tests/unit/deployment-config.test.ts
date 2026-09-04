import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('production deployment configuration', () => {
  it('preserves the public port for Next Server Action origin validation', () => {
    for (const file of ['default.conf', 'https.example.conf']) {
      const nginx = readFileSync(join(root, 'deploy', 'nginx', file), 'utf8')
      expect(nginx).toContain('proxy_set_header Host $http_host;')
      expect(nginx).toContain('proxy_set_header X-Forwarded-Host $http_host;')
      expect(nginx).not.toContain('proxy_set_header X-Forwarded-Host $host;')
      expect(nginx).toContain('proxy_buffering off;')
    }
  })

  it('keeps secrets and persisted data outside the Docker build context', () => {
    const ignored = readFileSync(join(root, '.dockerignore'), 'utf8')
    expect(ignored).toContain('deploy/*.env')
    expect(ignored).toContain('deploy/certs')
    expect(ignored).toContain('var/backups/*')
    expect(ignored).toContain('var/media/*')
  })
})
