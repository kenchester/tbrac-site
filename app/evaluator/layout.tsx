import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isEvaluator, isEvaluatorEmail, needsTwoFactorSetup } from "@/lib/evaluators"

// Server-side gate for every /evaluator/* page: signed in, allowlisted, email verified, second factor on.
export default async function EvaluatorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/evaluator-login")
  if (!isEvaluatorEmail(session.user.email)) redirect("/evaluator-login?denied=1")
  if (needsTwoFactorSetup(session.user)) redirect("/evaluator-login/two-factor")
  if (!isEvaluator(session.user)) redirect("/evaluator-login?unverified=1")
  return <>{children}</>
}
