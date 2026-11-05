import { authenticatedRequest } from "./api-client";

export interface Certification {
  report_number: string; engagement_id: string; status: string; status_note: string | null; tier: string | null;
  confidence: string | null; outlook: string | null; issued_at: string; valid_until: string; fingerprint: string;
  test: boolean; can_reevaluate: boolean; full_report: boolean;
}
export interface Payment {
  id: string; engagement_id: string; customer_id: string; fee_type: string; description: string; amount_cents: number;
  currency: string; status: "requested" | "paid" | "canceled"; requested_at: string; paid_at: string | null;
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

export const money = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
export const verifyUrl = (n: string) => `https://tbrac.org/verify/${n}`;
export const certificateUrl = (n: string) => `/api/certificate/${n}`;
