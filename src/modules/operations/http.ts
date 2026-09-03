type Owner = { id: string; username: string }

export function createPortableExportHttpHandler(dependencies: {
  getOwner(): Promise<Owner | null>
  createExport(input: { ownerUsername: string; generatedAt: Date }): Promise<unknown>
  now?: () => Date
}) {
  return async function GET() {
    const owner = await dependencies.getOwner()
    if (!owner) return Response.json({ code: 'unauthorized' }, { status: 401 })

    const generatedAt = dependencies.now?.() ?? new Date()
    const compactStamp = generatedAt.toISOString().replaceAll(/[-:.]/g, '').replace('000Z', 'Z')
    const body = await dependencies.createExport({ ownerUsername: owner.username, generatedAt })
    return new Response(`${JSON.stringify(body, null, 2)}\n`, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="keleoz-continuum-${compactStamp}.json"`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  }
}
