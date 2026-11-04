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

type MaybeUser = { email?: string | null; emailVerified?: boolean | null; twoFactorEnabled?: boolean | null } | null | undefined

const require2fa = () => process.env.EVALUATOR_REQUIRE_2FA !== "false"

/** Allowlisted and verified, but without the required second factor yet. */
export function needsTwoFactorSetup(user: MaybeUser): boolean {
  return !!user?.emailVerified && isEvaluatorEmail(user.email) && require2fa() && !user.twoFactorEnabled
}

/**
 * Allowlisted, verified by email link, and (because evaluators see confidential company
 * documents) signed in with a second factor. Mirrors the API's evaluator_session_ok.
 */
export function isEvaluator(user: MaybeUser): boolean {
  return !!user?.emailVerified && isEvaluatorEmail(user.email) && (!require2fa() || !!user.twoFactorEnabled)
}
