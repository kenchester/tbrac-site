import { headers } from "next/headers"
import { auth } from "./auth"

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000"

/**
 * Call the FastAPI backend from a route handler as the signed-in user.
 * Returns null when there is no valid session.
 */
export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response | null> {
  let token: string
  try {
    ;({ token } = await auth.api.getToken({ headers: await headers() }))
  } catch {
    return null
  }
  return fetch(`${API_ORIGIN}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  })
}
