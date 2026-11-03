import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isEvaluatorEmail } from "@/lib/evaluators"

// Lets the evaluator login page tell non-evaluators why they can't proceed.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  return NextResponse.json({ evaluator: isEvaluatorEmail(session?.user.email) })
}
