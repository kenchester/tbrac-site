import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth, authDb } from "@/lib/auth"
import { markPaid, stripe } from "@/lib/payments"
import { backendFetch } from "@/lib/server-api"

const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"

interface Payment { id: string; engagement_id: string; customer_id: string; description: string; amount_cents: number; currency: string; status: string }

// Starts card/bank checkout for a requested assessment fee. The API confirms the caller may see
// this company's payments; staff assisting a client can't pay for it; dummy companies are marked
// paid without charging anything.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Sign in first" }, { status: 401 })
  const { customer_id } = (await request.json().catch(() => ({}))) as { customer_id?: string }
  if (!/^[0-9a-f-]{36}$/.test(customer_id ?? "") || !/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const list = await backendFetch(`/api/v1/customers/${customer_id}/payments`)
  if (!list?.ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const payment = ((await list.json()) as Payment[]).find((p) => p.id === id)
  if (!payment || payment.status !== "requested") return NextResponse.json({ error: "This fee is not open for payment" }, { status: 409 })

  const ctx = await backendFetch(`/api/v1/company-view/context/${customer_id}`)
  const mode = ctx?.ok ? ((await ctx.json()) as { mode: string; customer_name: string }).mode : "owner"
  if (mode === "assist") return NextResponse.json({ error: "The company pays its own fee; TBRAC staff can't pay on its behalf" }, { status: 403 })
  if (mode === "sandbox") {
    await markPaid(id, { actor: `${session.user.email} (dummy-data test payment, nothing charged)`, payer: session.user.email })
    return NextResponse.json({ url: `${SITE}/customers/${customer_id}?payment=success` })
  }
  if (!stripe) return NextResponse.json({ error: "not_enabled" }, { status: 503 })

  const meta = { payment_id: id, engagement_id: payment.engagement_id, customer_id: customer_id! }
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ quantity: 1, price_data: { currency: payment.currency, unit_amount: payment.amount_cents,
      product_data: { name: `TBRAC · ${payment.description}`, description: "Flat fee, the same for every company; it does not depend on the outcome." } } }],
    customer_email: session.user.email,
    client_reference_id: id,
    metadata: meta,
    payment_intent_data: { metadata: meta, description: `TBRAC ${payment.description}` },
    success_url: `${SITE}/customers/${customer_id}?payment=success`,
    cancel_url: `${SITE}/customers/${customer_id}?payment=canceled`,
  }, { idempotencyKey: `checkout-${id}-${Math.floor(Date.now() / 600000)}` })
  await authDb.query("update payments set stripe_session_id = $2 where id = $1 and status = 'requested'", [id, checkout.id])
  return NextResponse.json({ url: checkout.url })
}
