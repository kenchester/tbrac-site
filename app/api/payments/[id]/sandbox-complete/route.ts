import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markPaid } from "@/lib/payments"
import { backendFetch } from "@/lib/server-api"

// Completes TBRAC's built-in test checkout. Only for dummy companies (checked with the API), and
// it records the payment exactly as Stripe's webhook would, so the rest of the flow can be tested.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Sign in first" }, { status: 401 })
  const { customer_id, outcome } = (await request.json().catch(() => ({}))) as { customer_id?: string; outcome?: string }
  if (!/^[0-9a-f-]{36}$/.test(customer_id ?? "") || !/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  const ctx = await backendFetch(`/api/v1/company-view/context/${customer_id}`)
  const mode = ctx?.ok ? ((await ctx.json()) as { mode: string }).mode : null
  if (mode !== "sandbox") return NextResponse.json({ error: "Test checkout is only for dummy companies" }, { status: 403 })
  const list = await backendFetch(`/api/v1/customers/${customer_id}/payments`)
  const p = list?.ok ? ((await list.json()) as { id: string; status: string }[]).find((x) => x.id === id) : null
  if (!p || p.status !== "requested") return NextResponse.json({ error: "This fee is not open for payment" }, { status: 409 })
  if (outcome === "decline") return NextResponse.json({ error: "Your card was declined (test). Nothing was charged." }, { status: 402 })
  await markPaid(id, { actor: `test checkout by ${session.user.email} (dummy data, no money moved)`, payer: session.user.email,
                       intent: `test_${id.slice(0, 8)}` })
  return NextResponse.json({ url: `/customers/${customer_id}?payment=success` })
}
