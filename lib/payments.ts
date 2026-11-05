import Stripe from "stripe"
import { authDb } from "@/lib/auth"

export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

/**
 * Record a fee as paid: the payment, the engagement's fee status, and an audit entry (chained by the
 * database). Idempotent: a payment already marked paid is left alone. Returns false if nothing changed.
 */
export async function markPaid(paymentId: string, opts: { intent?: string | null; payer?: string | null; actor: string }): Promise<boolean> {
  const client = await authDb.connect()
  try {
    await client.query("begin")
    const { rows } = await client.query<{ engagement_id: string; amount_cents: string; description: string }>(
      `update payments set status = 'paid', paid_at = now(), stripe_payment_intent = coalesce($2, stripe_payment_intent), payer_email = $3
       where id = $1 and status = 'requested' returning engagement_id, amount_cents, description`,
      [paymentId, opts.intent ?? null, opts.payer ?? null])
    if (!rows.length) { await client.query("rollback"); return false }
    const p = rows[0]
    await client.query("update engagements set fee_status = 'paid' where id = $1", [p.engagement_id])
    await client.query(
      `insert into audit_logs (id, "timestamp", user_id, action, resource_type, resource_id, old_values, new_values)
       values (gen_random_uuid(), now(), null, 'payment.paid', 'engagement', $1, null, $2)`,
      [p.engagement_id, JSON.stringify({ fee_status: "paid", amount: Number(p.amount_cents) / 100, description: p.description,
        payment_id: paymentId, _actor: opts.actor, _target: p.description })])
    await client.query("commit")
    return true
  } catch (e) {
    await client.query("rollback").catch(() => {})
    throw e
  } finally {
    client.release()
  }
}
