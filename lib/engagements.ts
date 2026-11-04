import { authenticatedRequest } from "./api-client";

// Types mirror tbrac-server app/schemas/engagement.py and app/methodology/v1.py.

export type Stage =
  | "acceptance" | "scoping" | "documents" | "screening" | "verification"
  | "scoring" | "reply" | "committee" | "issued" | "under_review" | "withdrawn" | "expired";
export const STAGES: Stage[] = [
  "acceptance", "scoping", "documents", "screening", "verification",
  "scoring", "reply", "committee", "issued", "under_review", "withdrawn", "expired",
];
export type Grade = "E1" | "E2" | "E3" | "E4";
export type GateStatus = "clear" | "triggered" | "unknown";

export interface Methodology {
  version: string;
  domains: Record<string, { name: string; weight: number }>;
  indicators: Record<string, { name: string; w: number; material: boolean }>;
  gates: Record<string, { kind: "hard" | "soft"; name: string; cap?: string; indicators: string[] }>;
  evidence_grades: Grade[];
  validity_months: number;
  committee_min_members: number;
  /** Appendix C anchors: written description of each level 0-4, plus expected evidence. */
  anchors: Record<string, { name: string; evidence: string | null; levels: Record<string, string> }>;
}

export interface Entity {
  id: string; name: string; name_zh: string | null; role: string; parent_id: string | null;
  jurisdiction: string | null; registry_id: string | null; ownership_pct: number | null;
  is_state_linked: boolean; notes: string | null; created_at: string;
}
export interface Evidence {
  id: string; source_type: string; authored_by_subject: boolean; description: string;
  source_ref: string | null; document_id: string | null; obtained_at: string | null;
  indicator_codes: string[]; gate_codes: string[]; recorded_by: string; created_at: string;
}
export interface IndicatorScore {
  code: string; inherent_level: number; residual_level: number | null; evidence_grade: Grade;
  mitigation: string | null; mitigation_grade: Grade | null; mitigation_enforceable: boolean;
  rationale: string | null; scored_by: string; updated_at: string;
}
export interface GateResult { code: string; status: GateStatus; basis: string | null; checked_at: string; checked_by: string }
export interface Rating {
  status: "complete" | "incomplete"; tier: string | null; confidence: string | null; inherent_tier: string | null;
  domain_tiers: Record<string, string>; weights: Record<string, number>; verified_share: number | null;
  reasons: string[]; missing: string[]; methodology_version: string; error: string | null;
}
export interface NotifyContact { name: string; organization?: string | null; email: string }
export interface StatusNotice {
  id: string; report_number: string | null; kind: string; recipient_name: string | null; recipient_email: string;
  audience: "relying_party" | "company"; status: string; status_note: string | null; test: boolean;
  created_at: string; sent_at: string | null; attempts: number; last_error: string | null;
}
/** Send queued status notices now (site route; the API only queues them). */
export const sendPendingNotices = () =>
  fetch("/api/notices/drain", { method: "POST" }).then((r) => (r.ok ? r.json() as Promise<{ sent: number; failed: number }> : { sent: 0, failed: 0 }));

export interface EngagementSummary {
  id: string; customer_id: string; customer_name: string; is_sandbox?: boolean; engagement_type: string; track: string; stage: Stage;
  methodology_version: string; lead_analyst: string | null; issued_at: string | null; valid_until: string | null;
  created_at: string; updated_at: string;
}
export interface StatutoryFinding {
  jurisdiction: string; test: string; result: "meets" | "does_not_meet" | "not_determined"; basis: string | null;
}
export type Outlook = "stable" | "positive" | "negative";
export interface AiSuggestion { level: number | null; max_grade: Grade; reasons: string; missing: string; confidence: "low" | "medium" | "high" }
export interface AiSummary {
  scoring?: { run_at: string; model: string; by: string; suggestions: Record<string, AiSuggestion>; stale_changes: number;
    divergences: { code: string; analyst: number; ai: number }[] };
  consistency?: { run_at: string; model: string; by: string; stale_changes: number;
    issues: { codes: string[]; issue: string; severity: "high" | "medium" | "low" }[] };
}
export interface DocAnalysis {
  run_at: string; model: string; by: string; language: string | null; document_type: string; summary_en: string; truncated: boolean;
  key_facts: { fact: string; quote: string; quote_en: string; quote_verified: boolean }[];
  entities: { name: string; name_zh: string | null; role: string; held_by: string | null; ownership_pct: number | null;
    jurisdiction: string | null; registry_id: string | null; state_linked: boolean; quote: string; quote_verified: boolean }[];
  flags: { issue: string; codes: string[]; quote: string; quote_verified: boolean }[];
}
export interface EngagementDocument {
  id: string; filename: string; mime_type: string; size: number; uploaded_at: string | null; request: string | null;
  has_text: boolean; text_chars: number; page_count: number | null; language: string | null; text_problem: string | null; ocr: boolean;
  analysis: DocAnalysis | null;
}
export interface MethodologyVersionInfo {
  version: string; status: "draft" | "published" | "retired"; domain_weights: Record<string, number>; changelog: string;
  sensitivity: string | null; published_at: string | null; created_by?: string; created_at?: string; published_by?: string | null;
  panel: { composition: { role: string; count: number }[]; size: number; rounds: number; panelist_crs: number[]; aggregate_cr: number;
    lambda_max: number; consensus_notes: string | null; judgments?: number[][]; inconsistent_panelists?: number[] };
}
export interface HitTriage { run_at: string; model: string; assessment: "likely_same" | "likely_different" | "unclear"; reasons: string[]; differences: string[]; to_confirm: string; confidence: string }
export interface ReplyMap { run_at: string; model: string; items: { concerns: string; code: string | null; is_entity: boolean; kind: string; summary: string; quote: string; quote_verified: boolean; action: string }[] }
export interface DraftedConditions { run_at: string; model: string; conditions: { text: string; codes: string[]; why: string }[] }
export interface Intake {
  assessment: { id: string; status: string; submitted_at: string | null; total_score: number | null; risk_tier: string | null; linked: boolean } | null;
  answers: { question_id: string; module_key: string; module_number: number; value: number; feeds: string[]; low: boolean }[];
  red_flags: { question_id: string; module_key: string; severity: "hard" | "soft"; label: string }[];
}
export interface ExternalMember { name: string; affiliation: string; independence_confirmed: boolean }
export interface CommitteeDecision {
  id: string; decision: "approve" | "return"; chair: string; members: string[]; rationale: string;
  external_members: { name: string; affiliation: string }[];
  dissent: string | null; decided_at: string; tier: string | null; confidence: string | null;
}
export interface AuditEntry { at: string; actor: string | null; target: string | null; action: string; old: Record<string, unknown> | null; new: Record<string, unknown> }
export interface EngagementDetail extends EngagementSummary {
  project_description: string | null; relying_parties: string[]; overlay: Record<string, number>;
  outlook: Outlook | null; statutory_findings: StatutoryFinding[]; conditions: string[];
  subject_reply: string | null; rating_snapshot: Rating | null;
  committee_decisions: CommitteeDecision[]; committee_status: { approved: boolean; reason: string };
  review_started_at: string | null; review_due_at: string | null; review_reason: string | null; last_monitored_at: string | null;
  engagement_letter_signed_at: string | null; engagement_letter_ref: string | null;
  fee_amount: number | null; fee_currency: string; fee_status: FeeStatus; reliance_letters: RelianceLetter[];
  notify_contacts: NotifyContact[]; notices: StatusNotice[];
  reply_shared_at: string | null; reply_due_at: string | null; reply_received_at: string | null; reply_submitted_by: string | null;
  declarations: Declaration[]; signoffs: Signoff[]; readiness: ReadinessCheck[];
  grade_support: Record<string, { items: number; independent: number; best: Grade }>;
  report_number: string | null; report_fingerprint: string | null;
  ai_processing_allowed: boolean; ai: AiSummary;
  entities: Entity[]; evidence: Evidence[]; indicator_scores: IndicatorScore[]; gate_results: GateResult[]; rating: Rating;
}

export interface ScreenHit { query: string; listed_name: string; matched_on: string; strength: "match" | "possible"; score: number | null; scope: string | null; gate?: string }
export interface ScreenResult {
  list: string; title: string; source_url: string; as_of: string | null; retrieved_at: string | null;
  gate: string; indicator: string; hits: ScreenHit[]; category_entries: string[]; note: string | null;
}
export interface ScreenResponse { screened_names: string[]; screened_at: string; csl: "ok" | "error" | "not_configured"; results: ScreenResult[] }

const base = "/api/v1";
export type RequestStatus = "open" | "submitted" | "accepted" | "returned" | "refused" | "waived";
export interface Attestation { signer_name: string; signer_title: string; statement: string; email: string; attested_at: string }
export interface DocRequest {
  id: string; engagement_id: string; template_key: string | null; domain: string | null; title: string;
  description: string | null; indicator_codes: string[]; gate_codes: string[]; due_date: string | null;
  status: RequestStatus; document_ids: string[]; company_note: string | null; attestation: Attestation | null;
  submitted_at: string | null; reviewer_note: string | null; reviewed_by: string | null; reviewed_at: string | null;
  created_by: string; created_at: string;
}
export interface RequestTemplate { domain: string; title: string; description: string; indicators: string[]; gates: string[] }
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Open", submitted: "Submitted", accepted: "Accepted", returned: "Returned", refused: "Refused", waived: "Waived",
};
export const REQUEST_STATUS_CLASS: Record<RequestStatus, string> = {
  open: "bg-slate-100 text-slate-700", submitted: "bg-blue-100 text-blue-800", accepted: "bg-green-100 text-green-800",
  returned: "bg-amber-100 text-amber-800", refused: "bg-red-100 text-red-800", waived: "bg-slate-100 text-slate-500",
};

export type FeeStatus = "none" | "quoted" | "invoiced" | "escrowed" | "paid";
export interface RelianceLetter { relying_party: string; signer?: string | null; countersigned_at?: string | null; ref?: string | null }
export interface Declaration { evaluator: string; cleared: boolean; disclosure: string | null; statements: Record<string, boolean>; declared_at: string }
export interface Signoff { id: string; kind: "second_review" | "counsel_review"; signed_by: string; counsel_name: string | null; note: string; signed_at: string; tier: string | null }
export interface ReadinessCheck { key: string; label: string; ok: boolean; detail: string; blocks: "committee" | "issue" | "warning" }

export interface MonitoringEvent {
  id: string; engagement_id: string; kind: string; severity: "info" | "warning" | "critical"; message: string;
  details: Record<string, unknown>; created_at: string; acknowledged_by: string | null; acknowledged_at: string | null;
  customer_name?: string;
}
export interface MonitoringConfig {
  triggers: Record<string, string>; watch_dates: { date: string; item: string }[];
  under_review_days: number; expiry_warning_days: number;
}
export type ReviewActionName = "start" | "affirm" | "reopen" | "withdraw" | "expire";
export const SEVERITY_CLASS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200", warning: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-slate-100 text-slate-700",
};
/** Stages an evaluator can set directly; after issue the stage changes only through review actions. */
export const PRE_ISSUE_STAGES: Stage[] = ["acceptance", "scoping", "documents", "screening", "verification", "scoring", "reply", "committee", "issued", "withdrawn"];

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const engagementsApi = {
  methodology: () => authenticatedRequest<Methodology>(`${base}/methodology`),
  subjects: (search: string) =>
    authenticatedRequest<{ id: string; name: string; chinese_name: string | null }[]>(
      `${base}/engagement-subjects?search=${encodeURIComponent(search)}`),
  list: () => authenticatedRequest<EngagementSummary[]>(`${base}/engagements`),
  get: (id: string) => authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}`),
  create: (body: {
    customer_id: string; engagement_type: string; track?: string;
    project_description?: string; relying_parties?: string[]; request_id?: string;
  }) => authenticatedRequest<EngagementDetail>(`${base}/engagements`, json("POST", body)),
  update: (id: string, body: Partial<Pick<EngagementDetail,
    "stage" | "project_description" | "relying_parties" | "overlay" | "engagement_type" | "track" | "lead_analyst"
    | "outlook" | "statutory_findings" | "conditions" | "subject_reply" | "engagement_letter_signed_at" | "engagement_letter_ref"
    | "fee_amount" | "fee_currency" | "fee_status" | "reliance_letters" | "notify_contacts" | "ai_processing_allowed">>) =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}`, json("PATCH", body)),
  addEntity: (id: string, body: Partial<Entity> & { name: string; role: string }) =>
    authenticatedRequest<Entity>(`${base}/engagements/${id}/entities`, json("POST", body)),
  deleteEntity: (id: string, entityId: string) =>
    authenticatedRequest<void>(`${base}/engagements/${id}/entities/${entityId}`, { method: "DELETE" }),
  addEvidence: (id: string, body: Partial<Evidence> & { source_type: string; description: string }) =>
    authenticatedRequest<Evidence>(`${base}/engagements/${id}/evidence`, json("POST", body)),
  deleteEvidence: (id: string, evidenceId: string) =>
    authenticatedRequest<void>(`${base}/engagements/${id}/evidence/${evidenceId}`, { method: "DELETE" }),
  scoreIndicator: (id: string, code: string, body: Omit<IndicatorScore, "code" | "scored_by" | "updated_at">) =>
    authenticatedRequest<IndicatorScore>(`${base}/engagements/${id}/indicators/${code}`, json("PUT", body)),
  committee: (id: string, body: { decision: "approve" | "return"; members: string[]; rationale: string; dissent?: string | null;
    external_members?: ExternalMember[] }) =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}/committee`, json("POST", body)),
  requestList: () => authenticatedRequest<{ items: Record<string, RequestTemplate>; attestation_statement: string }>(`${base}/document-request-list`),
  requests: (id: string) => authenticatedRequest<DocRequest[]>(`${base}/engagements/${id}/document-requests`),
  issueRequests: (id: string, body: { template_keys?: string[]; title?: string; description?: string; domain?: string;
    indicator_codes?: string[]; gate_codes?: string[]; due_date?: string | null }) =>
    authenticatedRequest<DocRequest[]>(`${base}/engagements/${id}/document-requests`, json("POST", body)),
  withdrawRequest: (id: string, rid: string) =>
    authenticatedRequest<void>(`${base}/engagements/${id}/document-requests/${rid}`, { method: "DELETE" }),
  reviewRequest: (id: string, rid: string, body: { action: "accept" | "return" | "waive"; note?: string }) =>
    authenticatedRequest<DocRequest>(`${base}/engagements/${id}/document-requests/${rid}/review`, json("POST", body)),
  monitoringConfig: () => authenticatedRequest<MonitoringConfig>(`${base}/monitoring/config`),
  events: (params: { engagement_id?: string; include_acknowledged?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.engagement_id) q.set("engagement_id", params.engagement_id);
    if (params.include_acknowledged) q.set("include_acknowledged", "true");
    return authenticatedRequest<MonitoringEvent[]>(`${base}/monitoring/events?${q}`);
  },
  acknowledge: (eventId: string, note?: string) =>
    authenticatedRequest<MonitoringEvent>(`${base}/monitoring/events/${eventId}/acknowledge`, json("POST", { note })),
  runMonitoring: () => authenticatedRequest<{ checked: number; events: number; under_review: number; expired: number }>(`${base}/monitoring/run`, { method: "POST" }),
  bringDown: (id: string) =>
    authenticatedRequest<{ screened_at: string; stage: string; events: MonitoringEvent[] }>(`${base}/engagements/${id}/bring-down`, { method: "POST" }),
  review: (id: string, body: { action: ReviewActionName; trigger?: string; note: string }) =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}/review`, json("POST", body)),
  independenceStatements: () => authenticatedRequest<Record<string, string>>(`${base}/independence-statements`),
  declare: (id: string, body: { statements: Record<string, boolean>; disclosure?: string }) =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}/declaration`, json("POST", body)),
  signoff: (id: string, body: { kind: "second_review" | "counsel_review"; note: string; counsel_name?: string }) =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}/signoffs`, json("POST", body)),
  shareForReply: (id: string, days?: number) =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}/reply/share`, json("POST", days ? { days } : {})),
  aiReview: (id: string, kind: "blind_scoring" | "consistency") =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}/ai-review`, json("POST", { kind })),
  documents: (id: string) => authenticatedRequest<EngagementDocument[]>(`${base}/engagements/${id}/documents`),
  analyzeDocument: (id: string, docId: string) =>
    authenticatedRequest<EngagementDocument>(`${base}/engagements/${id}/documents/${docId}/ai-analyze`, { method: "POST" }),
  /** Site route: reads the private file, extracts its text, stores it with the API. */
  extractText: async (docId: string) => {
    const res = await fetch(`/api/evaluator/documents/${docId}/extract`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail ?? "Extraction failed");
    return body as { chars: number; language: string | null; status: string };
  },
  versions: () => authenticatedRequest<{ current: string; builtin: { version: string; domain_weights: Record<string, number> };
    versions: MethodologyVersionInfo[]; pairs: [string, string][] }>(`${base}/methodology/versions`),
  saveVersion: (body: { version: string; judgments: number[][]; composition: { role: string; count: number }[]; rounds: number;
    consensus_notes?: string; sensitivity?: string; changelog: string }) =>
    authenticatedRequest<MethodologyVersionInfo>(`${base}/methodology/versions`, json("POST", body)),
  publishVersion: (v: string) => authenticatedRequest<MethodologyVersionInfo>(`${base}/methodology/versions/${encodeURIComponent(v)}/publish`, { method: "POST" }),
  retireVersion: (v: string) => authenticatedRequest<MethodologyVersionInfo>(`${base}/methodology/versions/${encodeURIComponent(v)}/retire`, { method: "POST" }),
  rebase: (id: string, version: string, reason: string) =>
    authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}/rebase`, json("POST", { version, reason })),
  aiTriage: (id: string, hit: { query: string; listed_name: string; matched_on?: string; list: string; scope?: string | null; strength?: string }) =>
    authenticatedRequest<HitTriage>(`${base}/engagements/${id}/ai/screen-triage`, json("POST", hit)),
  aiReplyMap: (id: string) => authenticatedRequest<ReplyMap>(`${base}/engagements/${id}/ai/reply-map`, { method: "POST" }),
  aiConditions: (id: string) => authenticatedRequest<DraftedConditions>(`${base}/engagements/${id}/ai/conditions`, { method: "POST" }),
  /** Site route: OCR with the vision model, page by page. */
  ocr: async (id: string, docId: string) => {
    const res = await fetch(`/api/evaluator/engagements/${id}/documents/${docId}/ocr`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail ?? "OCR failed");
    return body as { pages: number; truncated: boolean; problem: string | null };
  },
  aiSelfTest: () => authenticatedRequest<{ configured: boolean; model?: string; vision_model?: string; passed?: number; total?: number;
    results: { feature: string; ok: boolean; detail: string; seconds: number }[] }>(`${base}/ai/self-test`, { method: "POST" }),
  /** Site route: email the company (kind "requests" or "reply"). */
  notifyCompany: async (id: string, kind: "requests" | "reply") => {
    const res = await fetch(`/api/evaluator/engagements/${id}/notify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail ?? "Email failed");
    return body as { to: string };
  },
  intake: (id: string) => authenticatedRequest<Intake>(`${base}/engagements/${id}/intake`),
  documentAccess: (docId: string) => authenticatedRequest<{ at: string; actor: string | null; action: string }[]>(`${base}/documents/${docId}/access-log`),
  audit: (id: string) => authenticatedRequest<AuditEntry[]>(`${base}/engagements/${id}/audit`),
  screen: (id: string) => authenticatedRequest<ScreenResponse>(`${base}/engagements/${id}/screen`, { method: "POST" }),
  recordGate: (id: string, code: string, body: { status: GateStatus; basis?: string | null }) =>
    authenticatedRequest<GateResult>(`${base}/engagements/${id}/gates/${code}`, json("PUT", body)),
};

export const TIER_LABEL: Record<string, string> = {
  T1: "T1 · Low identified risk",
  T2: "T2 · Moderate",
  T3: "T3 · Elevated",
  T4: "T4 · High",
  UA: "Unable to Assess",
};
export const TIER_CLASS: Record<string, string> = {
  T1: "bg-green-50 text-green-800 border-green-300",
  T2: "bg-yellow-50 text-yellow-800 border-yellow-300",
  T3: "bg-orange-50 text-orange-800 border-orange-300",
  T4: "bg-red-50 text-red-800 border-red-300",
  UA: "bg-slate-100 text-slate-800 border-slate-300",
};
export const stageLabel = (s: string) => s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());
