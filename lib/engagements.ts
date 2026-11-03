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
export interface EngagementSummary {
  id: string; customer_id: string; customer_name: string; engagement_type: string; track: string; stage: Stage;
  methodology_version: string; lead_analyst: string | null; issued_at: string | null; valid_until: string | null;
  created_at: string; updated_at: string;
}
export interface StatutoryFinding {
  jurisdiction: string; test: string; result: "meets" | "does_not_meet" | "not_determined"; basis: string | null;
}
export type Outlook = "stable" | "positive" | "negative";
export interface EngagementDetail extends EngagementSummary {
  project_description: string | null; relying_parties: string[]; overlay: Record<string, number>;
  outlook: Outlook | null; statutory_findings: StatutoryFinding[]; conditions: string[];
  subject_reply: string | null; rating_snapshot: Rating | null;
  entities: Entity[]; evidence: Evidence[]; indicator_scores: IndicatorScore[]; gate_results: GateResult[]; rating: Rating;
}

export interface ScreenHit { query: string; listed_name: string; matched_on: string; strength: "match" | "possible"; score: number | null; scope: string | null }
export interface ScreenResult {
  list: string; title: string; source_url: string; as_of: string | null; retrieved_at: string | null;
  gate: string; indicator: string; hits: ScreenHit[]; category_entries: string[]; note: string | null;
}
export interface ScreenResponse { screened_names: string[]; screened_at: string; csl: "ok" | "error" | "not_configured"; results: ScreenResult[] }

const base = "/api/v1";
const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const engagementsApi = {
  methodology: () => authenticatedRequest<Methodology>(`${base}/methodology`),
  subjects: (search: string) =>
    authenticatedRequest<{ id: string; name: string; chinese_name: string | null }[]>(
      `${base}/engagement-subjects?search=${encodeURIComponent(search)}`),
  list: () => authenticatedRequest<EngagementSummary[]>(`${base}/engagements`),
  get: (id: string) => authenticatedRequest<EngagementDetail>(`${base}/engagements/${id}`),
  create: (body: {
    customer_id: string; engagement_type: string; track: string;
    project_description?: string; relying_parties?: string[];
  }) => authenticatedRequest<EngagementDetail>(`${base}/engagements`, json("POST", body)),
  update: (id: string, body: Partial<Pick<EngagementDetail,
    "stage" | "project_description" | "relying_parties" | "overlay" | "engagement_type" | "track" | "lead_analyst"
    | "outlook" | "statutory_findings" | "conditions" | "subject_reply">>) =>
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
