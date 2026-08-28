type Owner = { id: string; username: string }

export async function resolveOptionalOwner(lookup: () => Promise<Owner | null>) {
  try {
    return await lookup()
  } catch {
    return null
  }
}
