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

export interface DraftFindings {
  engagement_id: string; shared_at: string; due_at: string; open: boolean; response: string | null; received_at: string | null;
  findings: {
    entities: { name: string; name_zh: string | null; role: string; held_by: string | null; ownership_pct: number | null;
      jurisdiction: string | null; registry_id: string | null; state_linked: boolean }[];
    findings: { topic: string; finding: string }[];
    sources: { description: string; source: string | null; date: string | null }[];
  };
}
export const draftFindingsApi = {
  list: (customerId: string) => authenticatedRequest<DraftFindings[]>(`/api/v1/customers/${customerId}/draft-findings`),
  respond: (engagementId: string, response: string) =>
    authenticatedRequest<{ received_at: string }>(`/api/v1/draft-findings/${engagementId}/respond`, post({ response })),
};
