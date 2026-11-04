import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM || "TBRAC <no-reply@tbrac.org>"

/** Send a plain-text email. Without RESEND_API_KEY (local dev) it is logged instead. */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!resend) {
    console.log(`[email] To ${to}: ${subject}\n${text}`)
    return
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, text })
  if (error) throw new Error(error.message)
}
