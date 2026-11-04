import { get } from "@vercel/blob"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isEvaluator } from "@/lib/evaluators"
import { backendFetch } from "@/lib/server-api"

export const maxDuration = 300
type Params = { params: Promise<{ id: string; docId: string }> }
const MAX_PAGES = 20

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

/** Shrink a page image so it stays well under the provider's size limit while text remains legible. */
async function toPng(input: Buffer, raw?: { width: number; height: number; channels: 1 | 2 | 3 | 4 }) {
  const sharp = (await import("sharp")).default
  return (raw ? sharp(input, { raw }) : sharp(input))
    .resize({ width: 1600, height: 2200, fit: "inside", withoutEnlargement: true })
    .grayscale().png({ compressionLevel: 9 }).toBuffer()
}

/**
 * OCR a scanned document with the vision model, page by page (evaluators only).
 * Images are sent as they are; for PDFs, the largest image on each page (the scan) is used.
 * The API checks consent and stores page-tagged text.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id, docId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ detail: "Evaluators only" }, { status: 403 })

  const meta = await backendFetch(`/api/v1/documents/${encodeURIComponent(docId)}`)
  if (!meta?.ok) return NextResponse.json({ detail: "Document not found" }, { status: meta?.status ?? 401 })
  const doc = (await meta.json()) as { file_path: string; mime_type: string }
  const blob = await get(doc.file_path, { access: "private" })
  if (!blob?.stream) return NextResponse.json({ detail: "File not found in storage" }, { status: 404 })
  const bytes = Buffer.from(await readAll(blob.stream))

  const pages: Buffer[] = []
  try {
    if (doc.mime_type === "image/jpeg" || doc.mime_type === "image/png") {
      pages.push(await toPng(bytes))
    } else if (doc.mime_type === "application/pdf") {
      const { getDocumentProxy, extractImages } = await import("unpdf")
      const pdf = await getDocumentProxy(new Uint8Array(bytes))
      for (let p = 1; p <= Math.min(pdf.numPages, MAX_PAGES); p++) {
        const imgs = await extractImages(pdf, p)
        const big = imgs.sort((a, b) => b.width * b.height - a.width * a.height)[0]
        if (!big) continue
        const channels = Math.round(big.data.length / (big.width * big.height)) as 1 | 2 | 3 | 4
        pages.push(await toPng(Buffer.from(big.data), { width: big.width, height: big.height, channels }))
      }
      if (!pages.length) return NextResponse.json({ detail: "This PDF has no scanned page images to read" }, { status: 422 })
    } else {
      return NextResponse.json({ detail: "OCR supports scanned PDFs and JPEG/PNG images" }, { status: 422 })
    }
  } catch (e) {
    return NextResponse.json({ detail: `Could not read the file: ${e instanceof Error ? e.message : "unknown error"}` }, { status: 422 })
  }

  let last: Record<string, unknown> = {}
  for (let i = 0; i < pages.length; i++) {
    const res = await backendFetch(`/api/v1/engagements/${encodeURIComponent(id)}/documents/${encodeURIComponent(docId)}/ocr-page`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: i + 1, total: pages.length, image_base64: pages[i].toString("base64"), mime: "image/png" }),
    })
    if (!res) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
    last = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ detail: `Page ${i + 1}: ${(last as { detail?: string }).detail ?? "OCR failed"}` }, { status: res.status })
  }
  return NextResponse.json({ pages: pages.length, truncated: pages.length >= MAX_PAGES, problem: last.problem ?? null })
}
