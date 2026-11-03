/**
 * Evaluator access is an allowlist of email addresses in the EVALUATOR_EMAILS
 * env var (comma-separated). Empty = nobody can use the evaluator portal.
 *
 * Access also requires a verified email (isEvaluator), so registering an
 * allowlisted address without owning it grants nothing.
 */
export function isEvaluatorEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowed = (process.env.EVALUATOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}

/** Allowlisted AND the address has been verified by email link. */
export function isEvaluator(user: { email?: string | null; emailVerified?: boolean | null } | null | undefined): boolean {
  return !!user?.emailVerified && isEvaluatorEmail(user.email)
}
