export function hasAllowedOrigin(request: Request, siteOrigin: string): boolean {
  const origin = request.headers.get('origin')
  return origin === null || origin === siteOrigin
}
