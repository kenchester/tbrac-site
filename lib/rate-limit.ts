import { authDb } from "@/lib/auth"

/** The caller's IP as Vercel reports it. */
export const clientIp = (request: Request) => (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"

/**
 * Counts a hit against `key` in a fixed window (shared across serverless instances).
 * Returns true if the caller is within `limit`. Fails open: a database problem must not take a form down.
 */
export async function allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const { rows } = await authDb.query<{ count: number }>(
      `insert into rate_limits (key, window_start, count) values ($1, now(), 1)
       on conflict (key) do update set
         count = case when rate_limits.window_start < now() - make_interval(secs => $2) then 1 else rate_limits.count + 1 end,
         window_start = case when rate_limits.window_start < now() - make_interval(secs => $2) then now() else rate_limits.window_start end
       returning count`, [key, windowSeconds])
    return rows[0].count <= limit
  } catch {
    return true
  }
}
