import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { markPaid, stripe } from "@/lib/payments"

// Stripe calls this when a checkout completes. Card payments complete at once; bank transfers
// (ACH) complete later with checkout.session.async_payment_succeeded.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 })
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret)
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 })
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session
    const paymentId = s.metadata?.payment_id
    if (paymentId && s.payment_status === "paid") {
      await markPaid(paymentId, { intent: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id,
        payer: s.customer_details?.email ?? s.customer_email, actor: "stripe" })
    }
  }
  return NextResponse.json({ received: true })
}
