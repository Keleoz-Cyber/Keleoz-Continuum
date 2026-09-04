export function createHealthHttpHandler(dependencies: {
  checkDatabase(): Promise<void>
  startedAt: Date
  now?: () => Date
}) {
  return async function GET() {
    const now = dependencies.now?.() ?? new Date()
    const uptimeSeconds = Math.max(0, Math.floor((now.getTime() - dependencies.startedAt.getTime()) / 1_000))
    try {
      await dependencies.checkDatabase()
      return Response.json(
        { status: 'ready', database: 'ready', uptimeSeconds },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    } catch {
      return Response.json(
        { status: 'unavailable', database: 'unavailable', uptimeSeconds },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }
  }
}
