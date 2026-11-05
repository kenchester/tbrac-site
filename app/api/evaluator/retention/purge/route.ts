import { del } from "@vercel/blob"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isEvaluator } from "@/lib/evaluators"
import { backendFetch } from "@/lib/server-api"

// Deletes a company's stored files from Blob, then tells the API to delete the records.
// The API checks the retention policy both times; files go first so nothing is left orphaned.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ error: "Evaluator access required" }, { status: 403 })
  const { kind, customer_id } = (await request.json()) as { kind?: string; customer_id?: string }
  if ((kind !== "account" && kind !== "files") || !/^[0-9a-f-]{36}$/.test(customer_id ?? "")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  const list = await backendFetch(`/api/v1/retention/${kind}/${customer_id}/files`)
  if (!list?.ok) return NextResponse.json(await list?.json().catch(() => ({})) ?? { error: "Not allowed" }, { status: list?.status ?? 401 })
  const { paths } = (await list.json()) as { paths: string[] }
  for (let i = 0; i < paths.length; i += 100) {
    if (process.env.BLOB_READ_WRITE_TOKEN) await del(paths.slice(i, i + 100))
  }
  const done = await backendFetch(`/api/v1/retention/${kind}/${customer_id}/purge`, { method: "POST" })
  const body = await done?.json().catch(() => ({}))
  return NextResponse.json({ ...body, files_deleted: paths.length }, { status: done?.status ?? 500 })
}
