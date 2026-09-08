import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

const exec = promisify(execFile)
it('trusts only authenticated, valid EO IPs and strips origin credentials before proxying', async () => {
  const maps = await readFile('deploy/nginx/edgeone-client-ip.conf', 'utf8')
  const headers = await readFile('deploy/nginx/edgeone-proxy-headers.conf', 'utf8')
  const directory = await mkdtemp(join(tmpdir(), 'continuum-eo-proxy-'))
  const name = 'continuum-eo-test-' + randomUUID()
  const key = 'a'.repeat(64) // Test-only value; never production credentials.
  let started = false
  try {
    await writeFile(join(directory, 'maps.conf'), maps)
    await writeFile(join(directory, 'key.map'), `"~^${key}$" 1;\n`)
    await writeFile(join(directory, 'nginx.conf'), `events {}\nhttp {
      include /test/maps.conf;
      server { listen 8080; location / { proxy_pass http://127.0.0.1:8081; ${headers}
        proxy_set_header X-Transport-Peer $remote_addr; } }
      server { listen 127.0.0.1:8081; location / { default_type application/json;
        return 200 '{"ip":"$http_x_real_ip","xff":"$http_x_forwarded_for","key":"$http_x_continuum_origin_key","eo":"$http_eo_connecting_ip","peer":"$http_x_transport_peer"}'; } }
    }`)
    await exec('docker', ['run', '--rm',
      '-v', `${directory}:/test:ro`, '-v', `${join(directory, 'key.map')}:/etc/nginx/continuum-secrets/edgeone-key.map:ro`,
      '--entrypoint', 'nginx', 'nginx:1.28-alpine', '-c', '/test/nginx.conf', '-t'])
    await exec('docker', ['run', '-d', '--rm', '--name', name, '-p', '127.0.0.1::8080',
      '-v', `${directory}:/test:ro`, '-v', `${join(directory, 'key.map')}:/etc/nginx/continuum-secrets/edgeone-key.map:ro`,
      '--entrypoint', 'nginx', 'nginx:1.28-alpine', '-c', '/test/nginx.conf', '-g', 'daemon off;'])
    started = true
    const { stdout } = await exec('docker', ['port', name, '8080/tcp'])
    const target = stdout.trim()
    if (!/^127\.0\.0\.1:\d+$/.test(target)) throw new Error('Unexpected test endpoint')
    const request = async (token?: string, ip?: string) => {
      const input: Record<string, string> = { 'X-Real-IP': '192.0.2.9', 'X-Forwarded-For': '192.0.2.10, 192.0.2.11' }
      if (token !== undefined) input['X-Continuum-Origin-Key'] = token
      if (ip !== undefined) input['EO-Connecting-IP'] = ip
      const result = await fetch('http://' + target, { headers: input }).then(r => r.json())
      expect(result.key).toBe(''); expect(result.eo).toBe(''); expect(result.xff).toBe(result.ip)
      return result
    }
    for (const token of [undefined, 'wrong', key.toUpperCase(), key + ', wrong']) {
      const result = await request(token, '198.51.100.7')
      expect(result.ip).toBe(result.peer)
    }
    for (const ip of ['198.51.100.7', '2001:db8::7', '::ffff:198.51.100.7']) {
      expect((await request(key, ip)).ip).toBe(ip)
    }
    for (const ip of [undefined, '', 'not-an-ip', '999.1.2.3', '1.2.3.4, 5.6.7.8', ':::1', '255.255.255.255']) {
      const result = await request(key, ip)
      expect(result.ip).toBe(result.peer)
    }
  } finally {
    if (started) await exec('docker', ['stop', name]).catch(() => {})
    if (!resolve(directory).startsWith(resolve(tmpdir()) + sep) || !directory.includes('continuum-eo-proxy-')) throw new Error('Unsafe temporary path')
    await rm(directory, { recursive: true, force: true })
  }
}, 30000)
