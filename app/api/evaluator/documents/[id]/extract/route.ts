import { get } from "@vercel/blob"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isEvaluator } from "@/lib/evaluators"
import { backendFetch } from "@/lib/server-api"
import { matchesType } from "@/lib/file-signature"

type Params = { params: Promise<{ id: string }> }
const MAX_CHARS = 2_000_000

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let i = 0
  for (const c of chunks) { out.set(c, i); i += c.length }
  return out
}

/** Extract text from a company document (PDF or DOCX) and store it with the API. Evaluators only. */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ detail: "Evaluators only" }, { status: 403 })

  const meta = await backendFetch(`/api/v1/documents/${encodeURIComponent(id)}`)
  if (!meta?.ok) return NextResponse.json({ detail: "Document not found" }, { status: meta?.status ?? 401 })
  const doc = (await meta.json()) as { file_path: string; mime_type: string; original_filename: string }

  const blob = await get(doc.file_path, { access: "private" })
  if (!blob?.stream) return NextResponse.json({ detail: "File not found in storage" }, { status: 404 })
  const bytes = await readAll(blob.stream)
  if (!matchesType(bytes, doc.mime_type)) {
    return NextResponse.json({ detail: "The file's content does not match its declared type; it was not read" }, { status: 422 })
  }

  let text = "", pages: number | null = null, method = ""
  try {
    if (doc.mime_type === "application/pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf")
      const pdf = await getDocumentProxy(bytes)
      const r = await extractText(pdf, { mergePages: false })
      pages = r.totalPages
      text = (r.text as string[]).map((t, i) => `[page ${i + 1}]\n${t}`).join("\n\n")
      method = "unpdf"
    } else if (doc.mime_type.includes("wordprocessingml")) {
      const mammoth = await import("mammoth")
      text = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value
      method = "mammoth"
    } else {
      return NextResponse.json({ detail: "Text extraction reads PDF and Word files. For images and scans, use OCR scan." }, { status: 422 })
    }
  } catch (e) {
    return NextResponse.json({ detail: `Could not read the file: ${e instanceof Error ? e.message : "unknown error"}` }, { status: 422 })
  }

  const res = await backendFetch(`/api/v1/documents/${encodeURIComponent(id)}/text`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, MAX_CHARS), page_count: pages, method }),
  })
  if (!res) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  return new NextResponse(res.body, { status: res.status, headers: { "Content-Type": "application/json" } })
}
