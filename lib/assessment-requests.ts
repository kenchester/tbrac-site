import { authenticatedRequest } from "./api-client";

export type AssessmentRequestStatus = "new" | "contacted" | "engaged" | "declined";
export interface AssessmentRequest {
  id: string; customer_id: string; assessment_id: string | null; contact_name: string; contact_title: string | null;
  contact_phone: string | null; project_description: string; relying_party: string | null; timeline: string | null;
  engagement_type: "design" | "operating" | "unsure"; status: AssessmentRequestStatus; created_at: string;
  request_type?: "initial" | "reevaluation"; prior_report_number?: string | null;
  // evaluator view only
  customer_name?: string; requester_email?: string; language?: string; evaluator_note?: string | null;
  handled_by?: string | null; engagement_id?: string | null; updated_at?: string;
}
export interface AssessmentRequestIn {
  assessment_id?: string; contact_name: string; contact_title?: string; contact_phone?: string;
  project_description: string; relying_party?: string; timeline?: string;
  engagement_type: "design" | "operating" | "unsure"; language: "en" | "zh";
  request_type?: "initial" | "reevaluation"; prior_report_number?: string;
}

export const assessmentRequestsApi = {
  mine: (customerId: string) => authenticatedRequest<AssessmentRequest[]>(`/api/v1/customers/${customerId}/assessment-requests`),
  /** Site route: creates the request through the API, then sends the emails. */
  create: async (customerId: string, body: AssessmentRequestIn): Promise<AssessmentRequest> => {
    const res = await fetch("/api/assessment-requests", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer_id: customerId, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail ?? "Request failed");
    return data;
  },
  list: (includeClosed = false) =>
    authenticatedRequest<AssessmentRequest[]>(`/api/v1/assessment-requests${includeClosed ? "?include_closed=true" : ""}`),
  update: (id: string, body: { status: "new" | "contacted" | "declined"; evaluator_note?: string }) =>
    authenticatedRequest<AssessmentRequest>(`/api/v1/assessment-requests/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};
