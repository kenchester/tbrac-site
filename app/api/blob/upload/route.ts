import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { backendFetch } from "@/lib/server-api"

// Keep in sync with ALLOWED_MIME_TYPES / MAX_FILE_SIZE in the API's file_validation.py
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_FILE_SIZE = 50 * 1024 * 1024

// documents/{customer_id}/{sha256}
const PATHNAME_RE = /^documents\/([0-9a-f-]{36})\/[0-9a-f]{64}$/

// No onUploadCompleted: the browser registers the document with the API itself
// after upload, which also works locally where Blob can't reach a callback URL.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session) throw new Error("Not authenticated")
        const match = PATHNAME_RE.exec(pathname)
        if (!match) throw new Error("Invalid pathname")
        // Only allow uploads into the signed-in user's own customer folder.
        // The API returns 404 for customers the caller doesn't own.
        const owner = await backendFetch(`/api/v1/customers/${match[1]}`)
        if (!owner?.ok) throw new Error("Not allowed to upload for this customer")
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
          // Pathname is content-addressed, so re-uploading identical bytes is harmless.
          allowOverwrite: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    )
  }
}
