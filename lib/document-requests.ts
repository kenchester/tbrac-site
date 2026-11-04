import { authenticatedRequest } from "./api-client";
import type { Attestation, RequestStatus } from "./engagements";

// Company-side view of document requests (tbrac-server app/routers/document_requests.py).
export interface CompanyRequest {
  id: string; engagement_id: string; domain: string | null; title: string; description: string | null;
  due_date: string | null; status: RequestStatus; document_ids: string[]; company_note: string | null;
  attestation: Attestation | null; submitted_at: string | null; reviewer_note: string | null; created_at: string;
}
export interface CompanyEngagement {
  id: string; engagement_type: string; stage: string; project_description: string | null; closed: boolean;
  requests: CompanyRequest[];
}

const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });

export const documentRequestsApi = {
  list: (customerId: string) =>
    authenticatedRequest<{ engagements: CompanyEngagement[]; attestation_statement: string }>(
      `/api/v1/customers/${customerId}/document-requests`),
  submit: (id: string, body: { document_ids: string[]; note?: string; attestation: { signer_name: string; signer_title: string; agree: boolean } }) =>
    authenticatedRequest<CompanyRequest>(`/api/v1/document-requests/${id}/submit`, post(body)),
  refuse: (id: string, reason: string) =>
    authenticatedRequest<CompanyRequest>(`/api/v1/document-requests/${id}/refuse`, post({ reason })),
};

export const needsResponse = (r: CompanyRequest) => r.status === "open" || r.status === "returned";
