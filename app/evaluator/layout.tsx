import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isEvaluatorEmail } from "@/lib/evaluators"

// Server-side gate for every /evaluator/* page: signed in AND on the allowlist.
export default async function EvaluatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/evaluator-login")
  if (!isEvaluatorEmail(session.user.email)) redirect("/evaluator-login?denied=1")
  return <>{children}</>
}
