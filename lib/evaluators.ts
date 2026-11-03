/**
 * Evaluator access is an allowlist of email addresses in the EVALUATOR_EMAILS
 * env var (comma-separated). Empty = nobody can use the evaluator portal.
 *
 * Sign-up doesn't verify email ownership yet, so create each evaluator's
 * account *before* adding their address here; otherwise someone could
 * register that address first.
 */
export function isEvaluatorEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = (process.env.EVALUATOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}
