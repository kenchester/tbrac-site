import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [jwtClient()],
})

// JWT for the FastAPI backend, cached until shortly before it expires.
let cachedToken: { token: string; expiresAt: number } | null = null
const EXPIRY_MARGIN_MS = 60_000

function tokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    )
    return payload.exp * 1000
  } catch {
    return 0
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
    return cachedToken.token
  }
  const { data } = await authClient.token()
  if (!data?.token) {
    cachedToken = null
    return null
  }
  cachedToken = { token: data.token, expiresAt: tokenExpiry(data.token) }
  return data.token
}

export function clearAccessToken() {
  cachedToken = null
}
