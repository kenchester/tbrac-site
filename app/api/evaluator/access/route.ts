import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isEvaluator, isEvaluatorEmail, needsTwoFactorSetup } from "@/lib/evaluators"

// Lets the evaluator login page tell non-evaluators why they can't proceed.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  return NextResponse.json({
    evaluator: isEvaluator(session?.user),
    allowlisted: isEvaluatorEmail(session?.user.email),
    emailVerified: !!session?.user.emailVerified,
    needsTwoFactorSetup: needsTwoFactorSetup(session?.user),
  })
}
