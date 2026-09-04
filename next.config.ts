import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '*': ['./upstream/**/*'],
  },
  outputFileTracingExcludes: {
    '*': ['./var/backups/**/*', './var/media/**/*', './.playwright-cli/**/*'],
  },
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  experimental: {
    cpus: 2,
  },
}

export default config
