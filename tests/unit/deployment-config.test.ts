import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('production deployment configuration', () => {
  it('uses only a loopback app port behind the existing host TLS boundary', () => {
    const host = readFileSync(join(root, 'compose.host.yml'), 'utf8')
    expect(host).toContain('127.0.0.1:${CONTINUUM_HTTP_PORT:-8080}:3000')
    expect(host).toContain('profiles: ["standalone-proxy"]')
    const nginx = readFileSync(join(root, 'deploy/nginx/host-keleoz.conf'), 'utf8')
    expect(nginx).toContain('include /etc/nginx/snippets/continuum-edgeone-client-ip.conf;')
    expect(nginx).toContain('include /etc/nginx/snippets/continuum-edgeone-proxy-headers.conf;')
    const proxyHeaders = readFileSync(join(root, 'deploy/nginx/edgeone-proxy-headers.conf'), 'utf8')
    expect(proxyHeaders).toContain('proxy_set_header X-Forwarded-For $continuum_client_ip;')
    expect(proxyHeaders).toContain('proxy_set_header X-Real-IP $continuum_client_ip;')
    expect(proxyHeaders).toContain('proxy_set_header X-Continuum-Origin-Key "";')
    expect(nginx).toContain('proxy_set_header X-Forwarded-Proto https;')
    expect(nginx).toContain('return 308 https://keleoz.com$request_uri;')
    expect(nginx).toContain('listen 443 ssl http2;')
    expect(nginx).toContain('add_header Content-Encoding $continuum_font_encoding;')
    expect(nginx).toContain('add_header Vary Accept-Encoding always;')
    expect(nginx).toContain('root /var/www/keleoz-static;')
  })
  it('keeps production AI output and timeout budgets aligned with the validated environment example', () => {
    const local = readFileSync(join(root, '.env.example'), 'utf8')
    const production = readFileSync(join(root, 'deploy/production.env.example'), 'utf8')
    const compose = readFileSync(join(root, 'compose.prod.yml'), 'utf8')
    const settings = [...local.matchAll(/^(AI_(?:\w*MAX_OUTPUT_TOKENS|\w*TIMEOUT_MS))=(\d+)$/gm)]
    expect(settings.length).toBeGreaterThan(0)
    for (const [, key, value] of settings) {
      expect(production).toContain(`${key}=${value}`)
      expect(compose).toContain(`${key}: \${${key}:-${value}}`)
    }
    expect(production).toContain('AI_MODEL=deepseek-v4-flash-vision-exp')
    expect(production).toContain('AI_GATEWAY_ENABLED=false')
    expect(production).toContain('AI_DAILY_BUDGET_MICRO_USD=0')
  })

  it('gives maintenance backups read-only access to local media', () => {
    const compose = readFileSync(join(root, 'compose.prod.yml'), 'utf8')
    const backup = compose.split('  backup:')[1].split('\nvolumes:')[0]
    expect(backup).toContain('environment: *app-environment')
    expect(compose).toContain('MEDIA_LOCAL_ROOT: /app/var/media')
    expect(backup).toContain('continuum-media:/app/var/media:ro')
  })

  it('makes direct TLS opt-in with explicit read-only supplied certificates', () => {
    const path = join(root, 'compose.https.yml')
    expect(existsSync(path)).toBe(true)
    const tls = readFileSync(path, 'utf8')
    expect(tls).toContain('443}:443')
    expect(tls).toContain('https.example.conf:/etc/nginx/conf.d/default.conf:ro')
    for (const variable of ['CONTINUUM_TLS_CERT_FILE', 'CONTINUUM_TLS_KEY_FILE']) {
      expect(tls).toContain(`\${${variable}:?`)
    }
    expect(tls.match(/read_only: true/g)).toHaveLength(2)
    expect(tls.match(/create_host_path: false/g)).toHaveLength(2)
    const production = readFileSync(join(root, 'deploy/production.env.example'), 'utf8')
    expect(production).toContain('SITE_ORIGIN=https://keleoz.com')
    expect(production).toContain('CONTINUUM_HTTP_BIND=127.0.0.1')
    expect(production).toContain('CONTINUUM_HTTP_PORT=8080')
    const nginx = readFileSync(join(root, 'deploy/nginx/https.example.conf'), 'utf8')
    expect(nginx).toContain('server_name keleoz.com;')
    expect(nginx).not.toContain('acme-challenge')
  })

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
