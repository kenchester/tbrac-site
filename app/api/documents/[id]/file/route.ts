import { del, get } from "@vercel/blob"
import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-api"

type Params = { params: Promise<{ id: string }> }

interface DocumentRecord {
  file_path: string
  original_filename: string
  mime_type: string
}

// Looks the document up through the API, which also authorizes the caller.
async function fetchDocument(id: string) {
  const res = await backendFetch(`/api/v1/documents/${encodeURIComponent(id)}`)
  if (!res) {
    return { error: NextResponse.json({ detail: "Not authenticated" }, { status: 401 }) }
  }
  if (!res.ok) {
    return { error: new NextResponse(res.body, { status: res.status, headers: res.headers }) }
  }
  return { document: (await res.json()) as DocumentRecord }
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const { document, error } = await fetchDocument(id)
  if (error) return error

  const blob = await get(document.file_path, { access: "private" })
  if (!blob?.stream) {
    return NextResponse.json({ detail: "File not found" }, { status: 404 })
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": document.mime_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.original_filename)}`,
      "Cache-Control": "private, no-store",
    },
  })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const { document, error } = await fetchDocument(id)
  if (error) return error

  const res = await backendFetch(`/api/v1/documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (!res) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  if (!res.ok) return new NextResponse(res.body, { status: res.status, headers: res.headers })

  await del(document.file_path)
  return new NextResponse(null, { status: 204 })
}
