export function hasAllowedOrigin(request: Request, siteOrigin: string): boolean {
  const origin = request.headers.get('origin')
  return origin === siteOrigin
}

export function getTrustedProxyClientAddress(headers: Headers) {
  const address = headers.get('x-real-ip')?.trim()
  return address && address.length <= 64 ? address : 'unknown'
}
