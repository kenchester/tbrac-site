import { authenticatedRequest } from "./api-client";

export interface Certification {
  report_number: string; engagement_id: string; status: string; status_note: string | null; tier: string | null;
  confidence: string | null; outlook: string | null; issued_at: string; valid_until: string; fingerprint: string;
  test: boolean; can_reevaluate: boolean; full_report: boolean;
}
export interface Payment {
  id: string; engagement_id: string; customer_id: string; fee_type: string; description: string; amount_cents: number;
  currency: string; status: "requested" | "paid" | "waived" | "canceled"; requested_at: string; paid_at: string | null;
}

export const companyApi = {
  certifications: (customerId: string) => authenticatedRequest<Certification[]>(`/api/v1/customers/${customerId}/certifications`),
  payments: (customerId: string) => authenticatedRequest<Payment[]>(`/api/v1/customers/${customerId}/payments`),
  /** Site route: returns the checkout URL, or { error: "not_enabled" } before card payments are switched on. */
  checkout: async (paymentId: string, customerId: string): Promise<{ url?: string; error?: string }> => {
    const r = await fetch(`/api/payments/${paymentId}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }) });
    return r.json().catch(() => ({ error: "Checkout failed" }));
  },
};

/** Before launch, comprehensive assessments are "coming soon" except for testers with an early-access code. */
export const earlyAccessApi = {
  status: (): Promise<{ open: boolean }> => fetch("/api/v1/public/comprehensive-status").then((r) => r.json()).catch(() => ({ open: false })),
  /** Signed-out check on /comprehensive, before the tester registers. */
  checkPublic: async (code: string) => {
    const r = await fetch("/api/v1/public/early-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    if (!r.ok) throw Object.assign(new Error("invalid"), { status: r.status });
    return r.json();
  },
  check: (customerId: string, code: string) =>
    authenticatedRequest<{ ok: boolean }>(`/api/v1/customers/${customerId}/early-access`, { method: "POST", body: JSON.stringify({ code }) }),
  redeem: (paymentId: string, code: string) =>
    authenticatedRequest<Payment>(`/api/v1/payments/${paymentId}/redeem`, { method: "POST", body: JSON.stringify({ code }) }),
};

/** A code accepted on /comprehensive is remembered on this device until the request is sent, so the tester can
 *  register or sign in and land on their dashboard with the request form open. The API checks it again. */
const EARLY_KEY = "tbrac-early-access-code";
export const savedEarlyCode = {
  get: () => { try { return localStorage.getItem(EARLY_KEY) ?? ""; } catch { return ""; } },
  set: (c: string) => { try { localStorage.setItem(EARLY_KEY, c); } catch {} },
  clear: () => { try { localStorage.removeItem(EARLY_KEY); } catch {} },
};

/** Card checkout is switched on at launch (NEXT_PUBLIC_PAYMENTS_ENABLED=1); until then it shows "coming soon". */
export const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "1";

export const money = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
export const verifyUrl = (n: string) => `https://tbrac.org/verify/${n}`;
export const certificateUrl = (n: string) => `/api/certificate/${n}`;
