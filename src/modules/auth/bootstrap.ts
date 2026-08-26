export type OwnerBootstrapInput = {
  username: string
  password: string
}

export function parseOwnerBootstrap(source: Record<string, string | undefined>): OwnerBootstrapInput {
  const username = source.CONTINUUM_OWNER_USERNAME?.trim().toLowerCase() ?? ''
  const password = source.CONTINUUM_OWNER_PASSWORD ?? ''

  if (!username) {
    throw new Error('Owner username is required')
  }

  if (password.length < 14) {
    throw new Error('Owner password must contain at least 14 characters')
  }

  return {
    username,
    password,
  }
}
