import { authenticatedRequest } from "./api-client";

// Mirrors tbrac-server app/routers/company_view.py.
export type ViewMode = "owner" | "sandbox" | "assist";
export interface AssistedSession {
  id: string; customer_id: string; staff_email: string; reason: string;
  started_at: string; expires_at: string; ended_at: string | null; actions: number;
}
export interface Sandbox { id: string; name: string; created_at: string; engagements: number }
export interface ClientRow { id: string; name: string; chinese_name: string | null; created_at: string; engagements: number; assisting: boolean }
export interface ViewContext { mode: ViewMode; customer_name: string; session?: AssistedSession | null }

const base = "/api/v1/company-view";
const post = (body?: unknown): RequestInit => ({ method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const companyViewApi = {
  sandboxes: () => authenticatedRequest<Sandbox[]>(`${base}/sandboxes`),
  createSandbox: (name?: string, sample_profile = true) =>
    authenticatedRequest<{ id: string; name: string }>(`${base}/sandboxes`, post({ name: name || null, sample_profile })),
  deleteSandbox: (id: string) => authenticatedRequest<void>(`${base}/sandboxes/${id}`, { method: "DELETE" }),
  clients: (search?: string) =>
    authenticatedRequest<ClientRow[]>(`${base}/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  startAssist: (customer_id: string, reason: string) => authenticatedRequest<AssistedSession>(`${base}/assist`, post({ customer_id, reason })),
  endAssist: (id: string) => authenticatedRequest<AssistedSession>(`${base}/assist/${id}/end`, post()),
  sessions: (customerId?: string) =>
    authenticatedRequest<AssistedSession[]>(`${base}/assisted-sessions${customerId ? `?customer_id=${customerId}` : ""}`),
  context: (customerId: string) => authenticatedRequest<ViewContext>(`${base}/context/${customerId}`),
  companySessions: (customerId: string) => authenticatedRequest<AssistedSession[]>(`${base}/customers/${customerId}/assisted-sessions`),
};
