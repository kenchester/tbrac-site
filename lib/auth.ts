import { betterAuth } from "better-auth"
import { jwt, twoFactor } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { Pool } from "pg"
import { Resend } from "resend"

const baseURL = process.env.BETTER_AUTH_URL

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Shared with route handlers that need to look up a user's email (lib/email.ts callers).
export const authDb = new Pool({ connectionString: process.env.DATABASE_URL })

export const auth = betterAuth({
  baseURL,
  database: authDb,
  advanced: {
    // FastAPI parses the JWT `sub` as a UUID (customers.user_id etc.)
    database: { generateId: "uuid" },
  },
  // Limits live in the database: serverless instances share no memory, so the default in-memory
  // store would let a guesser spread attempts across instances. Keys are per IP and path.
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/two-factor/verify-totp": { window: 60, max: 10 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 5 },
      "/send-verification-email": { window: 300, max: 5 },
    },
  },
  // Verification emails prove address ownership. Company sign-in does not require
  // it yet, but evaluator access does (lib/evaluators.ts, API core/evaluators.py).
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (!resend) {
        console.log(`[auth] Email verification link for ${user.email}: ${url}`)
        return
      }
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "TBRAC <no-reply@tbrac.org>",
        to: user.email,
        subject: "Confirm your TBRAC email address",
        text: `Please confirm your email address by opening this link:\n\n${url}\n\nIf you didn't create a TBRAC account, you can ignore this email.`,
      })
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      if (!resend) {
        // Local dev without Resend: surface the link in the server log.
        console.log(`[auth] Password reset link for ${user.email}: ${url}`)
        return
      }
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "TBRAC <no-reply@tbrac.org>",
        to: user.email,
        subject: "Reset your TBRAC password",
        text: `Use this link to choose a new password:\n\n${url}\n\nIf you didn't request this, you can ignore this email.`,
      })
    },
  },
  plugins: [
    jwt({
      // python-jose (FastAPI) can't verify the default EdDSA keys.
      jwks: { keyPairConfig: { alg: "ES256" } },
      jwt: {
        issuer: baseURL,
        audience: baseURL,
        // Only what the API needs. twoFactorEnabled lets the API require a second factor for evaluators.
        definePayload: ({ user }) => ({
          email: user.email, emailVerified: user.emailVerified, name: user.name,
          twoFactorEnabled: Boolean((user as { twoFactorEnabled?: boolean }).twoFactorEnabled),
        }),
      },
    }),
    // TOTP (authenticator app) second factor; required for evaluators (lib/evaluators.ts, API core/evaluators.py).
    twoFactor({ issuer: "TBRAC" }),
    nextCookies(),
  ],
})
