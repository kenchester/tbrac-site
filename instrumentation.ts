// Records unhandled server errors from pages and route handlers in error_events, for the daily
// staff summary. Uses the route pattern (context.routePath), never the URL, so private-link tokens
// can't be stored. Never throws.
export async function onRequestError(err: unknown, request: { method: string }, context: { routePath: string; routeType: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  try {
    const { createHash } = await import("node:crypto")
    const { authDb } = await import("@/lib/auth")
    const e = err instanceof Error ? err : new Error(String(err))
    const route = `${request.method} ${context.routePath}`.slice(0, 300)
    const fp = createHash("sha256").update(`site|${route}|${e.name}|${(e.message ?? "").slice(0, 80)}`).digest("hex")
    await authDb.query(
      `insert into error_events (fingerprint, day, source, route, error_type, message, location, count, first_at, last_at)
       values ($1, current_date, 'site', $2, $3, $4, $5, 1, now(), now())
       on conflict (fingerprint, day) do update set count = error_events.count + 1, last_at = now()`,
      [fp, route, e.name.slice(0, 200), (e.message ?? "").split("\n")[0].slice(0, 300), context.routeType])
  } catch (e) {
    console.error("Could not record an error event", e)
  }
}
