"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventRow } from "@/components/monitoring-event-row";
import { getModuleByKey } from "@/lib/assessment-data";
import {
  engagementsApi, PRE_ISSUE_STAGES, stageLabel,
  type MonitoringConfig, type FeeStatus, type ExternalMember, type EngagementDocument, type HitTriage, type ReplyMap, type DraftedConditions, type Intake, type RelianceLetter, type ReadinessCheck, type MonitoringEvent, type ReviewActionName, TIER_CLASS, TIER_LABEL,
  type EngagementDetail, type GateStatus, type Grade, type IndicatorScore, type Methodology,
  type AuditEntry, type DocRequest, type RequestTemplate, REQUEST_STATUS_CLASS, REQUEST_STATUS_LABEL, type Outlook, type ScreenResponse, type StatutoryFinding,
} from "@/lib/engagements";

const LOCKED = new Set(["issued", "under_review", "withdrawn", "expired"]);
const POST_ISSUE = new Set(["issued", "under_review", "withdrawn", "expired"]);
const GRADES: Grade[] = ["E1", "E2", "E3", "E4"];
const GRADE_HINT: Record<Grade, string> = {
  E1: "E1 · Verified (2+ independent sources)",
  E2: "E2 · Cross-checked",
  E3: "E3 · Attested only",
  E4: "E4 · Unverifiable / refused",
};
const SOURCE_TYPES = ["subject_document", "registry", "us_list", "counsel_opinion", "technical_test", "public_record", "other"];
const ROLES = ["subject", "parent", "owner", "affiliate", "person", "state_body"];
const sel = "h-9 rounded-md border bg-transparent px-2 text-sm";
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <Badge variant="outline">Not rated</Badge>;
  return <Badge variant="outline" className={TIER_CLASS[tier] ?? ""}>{TIER_LABEL[tier] ?? tier}</Badge>;
}

// ------------------------------------------------------------------ rating panel
function RatingPanel({ eng, m }: { eng: EngagementDetail; m: Methodology }) {
  const r = eng.rating;
  const scored = eng.indicator_scores.length;
  const gated = eng.gate_results.filter((g) => g.status !== "unknown").length;
  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Rating (methodology {r.methodology_version})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {r.status === "incomplete" ? (
          <div className="space-y-2">
            <Badge variant="outline">Incomplete</Badge>
            <p className="text-muted-foreground">
              {scored}/{Object.keys(m.indicators).length} indicators scored · {gated}/{Object.keys(m.gates).length} red lines checked
            </p>
            {r.error && <p className="text-red-600">{r.error}</p>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={r.tier} />
              <Badge variant="outline">Confidence: {r.confidence}</Badge>
            </div>
            <p className="text-muted-foreground">
              Inherent tier {r.inherent_tier} → residual {r.tier} · {Math.round((r.verified_share ?? 0) * 100)}% of material indicators verified (E1–E2)
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(r.domain_tiers).map(([d, t]) => (
                <div key={d} className="flex justify-between gap-2">
                  <span className="truncate" title={m.domains[d]?.name}>{d} {m.domains[d]?.name}</span>
                  <span className="font-medium">{t}</span>
                </div>
              ))}
            </div>
            {r.reasons.length > 0 && (
              <div>
                <p className="font-medium">Rules that changed the result</p>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-muted-foreground">
                  {r.reasons.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
        <div className={`rounded-md border px-3 py-2 ${eng.committee_status.approved ? "border-green-300 bg-green-50 text-green-900" : "border-slate-200 bg-slate-50"}`}>
          <p className="font-medium">Committee</p>
          <p className="text-xs">{eng.committee_status.reason}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Working view for analysts. Reports show tiers and confidence only, never point scores.
        </p>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ overview
function Overview({ eng, m, onSaved }: { eng: EngagementDetail; m: Methodology; onSaved: (e: EngagementDetail) => void }) {
  const [project, setProject] = useState(eng.project_description ?? "");
  const [relying, setRelying] = useState(eng.relying_parties.join(", "));
  const [overlay, setOverlay] = useState<Record<string, string>>(
    Object.fromEntries(Object.keys(m.domains).map((d) => [d, String(eng.overlay[d] ?? 1)])));
  const [stage, setStage] = useState(eng.stage);
  const [msg, setMsg] = useState("");
  const locked = LOCKED.has(eng.stage);

  const save = async () => {
    setMsg("");
    try {
      const ov = Object.fromEntries(Object.entries(overlay).map(([d, v]) => [d, Number(v)]).filter(([, v]) => v !== 1));
      onSaved(await engagementsApi.update(eng.id, {
        project_description: project, overlay: ov,
        relying_parties: relying.split(",").map((s) => s.trim()).filter(Boolean),
      }));
      setMsg("Saved.");
    } catch (e) { setMsg(errMsg(e)); }
  };
  const changeStage = async () => {
    setMsg("");
    try { onSaved(await engagementsApi.update(eng.id, { stage })); setMsg(`Stage set to ${stageLabel(stage)}.`); }
    catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Label htmlFor="stage">Stage</Label>
          {POST_ISSUE.has(eng.stage) ? (
            <p className="text-sm">{stageLabel(eng.stage)}. After issue, use the <b>Monitoring</b> tab to place it Under Review, affirm, reopen for re-rating, withdraw or expire it.</p>
          ) : (
          <div className="flex flex-wrap gap-2">
            <select id="stage" className={sel} value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}>
              {PRE_ISSUE_STAGES.map((s) => <option key={s} value={s}>{stageLabel(s)}</option>)}
            </select>
            <Button variant="outline" onClick={changeStage} disabled={stage === eng.stage}>Update stage</Button>
          </div>
          )}
          <p className="text-xs text-muted-foreground">
            Issuing requires a complete rating, committee approval and an Outlook; it sets validity to {m.validity_months} months,
            records the screening baseline and locks the engagement. Daily monitoring then re-screens it.
          </p>
          {eng.issued_at && <p className="text-sm">Issued {new Date(eng.issued_at).toLocaleDateString()} · valid until {eng.valid_until ? new Date(eng.valid_until).toLocaleDateString() : "—"}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project (site, asset, data, technology)</Label>
            <Textarea id="project" rows={3} value={project} disabled={locked} onChange={(e) => setProject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relying">Relying parties (comma-separated)</Label>
            <Input id="relying" value={relying} disabled={locked} onChange={(e) => setRelying(e.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Project overlay (§7.6): weight multiplier per domain, 0.5–1.5</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(m.domains).map(([d, spec]) => (
                <label key={d} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{d} {spec.name} <span className="text-muted-foreground">({Math.round(spec.weight * 100)}%)</span></span>
                  <Input type="number" step="0.1" min="0.5" max="1.5" className="w-24" disabled={locked}
                    value={overlay[d]} onChange={(e) => setOverlay({ ...overlay, [d]: e.target.value })} />
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={locked}>Save overview</Button>
            {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ entities
function ScreeningPanel({ eng, reload }: { eng: EngagementDetail; reload: () => void }) {
  const [res, setRes] = useState<ScreenResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [triage, setTriage] = useState<Record<string, HitTriage | "busy" | string>>({});
  const locked = LOCKED.has(eng.stage);
  const explain = async (list: string, h: ScreenResponse["results"][number]["hits"][number]) => {
    const k = `${list}|${h.query}|${h.listed_name}`;
    setTriage((t) => ({ ...t, [k]: "busy" }));
    try {
      const r = await engagementsApi.aiTriage(eng.id, { query: h.query, listed_name: h.listed_name, matched_on: h.matched_on, list, scope: h.scope, strength: h.strength });
      setTriage((t) => ({ ...t, [k]: r }));
    } catch (e) { setTriage((t) => ({ ...t, [k]: errMsg(e) })); }
  };
  const run = async () => {
    setBusy(true); setMsg("");
    try { setRes(await engagementsApi.screen(eng.id)); reload(); }
    catch (e) { setMsg(errMsg(e)); }
    finally { setBusy(false); }
  };
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Screening against US lists</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={busy || locked || eng.entities.length === 0}>{busy ? "Screening…" : "Screen all entities"}</Button>
          <span className="text-muted-foreground">
            Checks every name in the entity map. Each run is saved to the evidence register with the list versions used.
            Hits are candidates: confirm them, then record the red line yourself.
          </span>
        </div>
        {msg && <p className="text-red-600">{msg}</p>}
        {res && (
          <div className="space-y-4">
            {res.csl === "not_configured" && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
                The Consolidated Screening List (SDN, Entity List, MEU and others) was not checked: no trade.gov API key is configured.
                Red lines H1, H2 and H6 need a separate screen until it is.
              </p>
            )}
            {res.csl === "error" && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-800">The Consolidated Screening List query failed; see its result below.</p>}
            {res.results.map((r) => (
              <div key={r.list} className="rounded-md border">
                <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-xs text-muted-foreground">as of {r.as_of ?? "—"}</span>
                  <Badge variant="outline" className={r.hits.length ? "border-red-400 text-red-700" : "border-green-400 text-green-700"}>
                    {r.hits.length ? `${r.hits.length} candidate hit${r.hits.length > 1 ? "s" : ""}` : "No hits"}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">Informs red line {r.gate} · indicator {r.indicator}</span>
                </div>
                {r.hits.length > 0 && (
                  <table className="w-full">
                    <tbody className="divide-y">
                      {r.hits.map((h, i) => (
                        <tr key={i} className="align-top">
                          <td className="px-3 py-2">{h.query}</td>
                          <td className="px-3 py-2">→ {h.listed_name}{h.matched_on !== h.listed_name && <div className="text-xs text-muted-foreground">matched on “{h.matched_on}”</div>}
                            {h.scope && <div className="text-xs text-muted-foreground">{h.scope}</div>}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Badge variant="outline">{h.strength === "match" ? "Name match" : "Possible match"}</Badge>
                            {h.gate && <Badge variant="outline" className="ml-1">Red line {h.gate}</Badge>}
                            {eng.ai_processing_allowed && (
                              <Button size="sm" variant="ghost" className="ml-1 h-6 px-2 text-xs" disabled={triage[`${r.list}|${h.query}|${h.listed_name}`] === "busy"}
                                onClick={() => explain(r.list, h)}>Explain (AI)</Button>
                            )}
                            {(() => {
                              const t = triage[`${r.list}|${h.query}|${h.listed_name}`];
                              if (!t || t === "busy") return null;
                              if (typeof t === "string") return <p className="mt-1 whitespace-normal text-xs text-red-600">{t}</p>;
                              const label = { likely_same: "Likely the same entity", likely_different: "Likely a different entity", unclear: "Unclear" }[t.assessment];
                              return (
                                <div className="mt-1 max-w-sm whitespace-normal rounded border bg-slate-50 p-2 text-xs">
                                  <p className={t.assessment === "likely_same" ? "font-medium text-red-700" : "font-medium"}>{label} · {t.confidence} confidence (AI, advisory)</p>
                                  {t.reasons.length > 0 && <ul className="list-disc pl-4">{t.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                                  {t.differences.length > 0 && <p className="text-muted-foreground">Differences: {t.differences.join("; ")}</p>}
                                  {t.to_confirm && <p><span className="font-medium">To settle it:</span> {t.to_confirm}</p>}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {r.category_entries.length > 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Also check by product category (not name-searchable): {r.category_entries.join(" · ")}
                  </div>
                )}
                {r.note && <div className="px-3 py-2 text-xs text-muted-foreground">{r.note}</div>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Entities({ eng, reload }: { eng: EngagementDetail; reload: () => void }) {
  const blank = { name: "", name_zh: "", role: "owner", parent_id: "", jurisdiction: "", registry_id: "", ownership_pct: "", is_state_linked: false, notes: "" };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState("");
  const locked = LOCKED.has(eng.stage);
  const names = useMemo(() => Object.fromEntries(eng.entities.map((e) => [e.id, e.name])), [eng.entities]);

  const add = async () => {
    setMsg("");
    try {
      await engagementsApi.addEntity(eng.id, {
        name: f.name, role: f.role, name_zh: f.name_zh || null, parent_id: f.parent_id || null,
        jurisdiction: f.jurisdiction || null, registry_id: f.registry_id || null,
        ownership_pct: f.ownership_pct === "" ? null : Number(f.ownership_pct), is_state_linked: f.is_state_linked, notes: f.notes || null,
      });
      setF(blank);
      reload();
    } catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>{["Entity", "Role", "Held by", "%", "Jurisdiction", "Registry ID", "State-linked", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {eng.entities.length === 0 && <tr><td colSpan={8} className="px-3 py-4 text-muted-foreground">No entities yet. Start with the subject, then trace owners up to natural persons and state bodies (§5.1).</td></tr>}
              {eng.entities.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2">{e.name}{e.name_zh ? <span className="text-muted-foreground"> · {e.name_zh}</span> : null}</td>
                  <td className="px-3 py-2">{e.role.replace("_", " ")}</td>
                  <td className="px-3 py-2">{e.parent_id ? names[e.parent_id] ?? "—" : "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{e.ownership_pct ?? "—"}</td>
                  <td className="px-3 py-2">{e.jurisdiction ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.registry_id ?? "—"}</td>
                  <td className="px-3 py-2">{e.is_state_linked ? <Badge variant="outline" className="border-orange-400 text-orange-700">Yes</Badge> : "No"}</td>
                  <td className="px-3 py-2 text-right">
                    {!locked && <Button variant="ghost" size="sm" onClick={() => engagementsApi.deleteEntity(eng.id, e.id).then(reload)}>Remove</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <ScreeningPanel eng={eng} reload={reload} />
      {!locked && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Add entity</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input aria-label="Name" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input aria-label="Chinese name" placeholder="Chinese name" value={f.name_zh} onChange={(e) => setF({ ...f, name_zh: e.target.value })} />
            <select aria-label="Role" className={sel} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
            <select aria-label="Held by" className={sel} value={f.parent_id} onChange={(e) => setF({ ...f, parent_id: e.target.value })}>
              <option value="">Held by… (optional)</option>
              {eng.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <Input aria-label="Ownership percent" type="number" min="0" max="100" step="0.001" placeholder="Ownership %" value={f.ownership_pct} onChange={(e) => setF({ ...f, ownership_pct: e.target.value })} />
            <Input aria-label="Jurisdiction" placeholder="Jurisdiction" value={f.jurisdiction} onChange={(e) => setF({ ...f, jurisdiction: e.target.value })} />
            <Input aria-label="Registry ID" placeholder="Registry ID (e.g. USCC)" value={f.registry_id} onChange={(e) => setF({ ...f, registry_id: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.is_state_linked} onChange={(e) => setF({ ...f, is_state_linked: e.target.checked })} /> State-linked
            </label>
            <Input aria-label="Notes" placeholder="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
              <Button onClick={add} disabled={!f.name}>Add entity</Button>
              {msg && <span className="text-sm text-red-600">{msg}</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ evidence
function EvidenceTab({ eng, reload }: { eng: EngagementDetail; reload: () => void }) {
  const blank = { source_type: "subject_document", authored_by_subject: true, description: "", source_ref: "", indicators: "", gates: "" };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState("");
  const locked = LOCKED.has(eng.stage);
  const codes = (s: string) => s.split(/[,\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);

  const add = async () => {
    setMsg("");
    try {
      await engagementsApi.addEvidence(eng.id, {
        source_type: f.source_type, authored_by_subject: f.authored_by_subject, description: f.description,
        source_ref: f.source_ref || null, indicator_codes: codes(f.indicators), gate_codes: codes(f.gates),
      });
      setF(blank);
      reload();
    } catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>{["Evidence", "Source", "Subject-authored", "Supports", "Recorded", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {eng.evidence.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-muted-foreground">No evidence recorded yet.</td></tr>}
              {eng.evidence.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2">{e.description}{e.source_ref && <div className="text-xs text-muted-foreground break-all">{e.source_ref}</div>}</td>
                  <td className="px-3 py-2">{e.source_type.replace("_", " ")}</td>
                  <td className="px-3 py-2">{e.authored_by_subject ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{[...e.indicator_codes, ...e.gate_codes].join(" ") || "—"}</td>
                  <td className="px-3 py-2 text-xs">{e.recorded_by}<br />{new Date(e.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    {!locked && <Button variant="ghost" size="sm" onClick={() => engagementsApi.deleteEvidence(eng.id, e.id).then(reload)}>Remove</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {!locked && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Record evidence</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Textarea aria-label="Description" className="sm:col-span-2" rows={2} placeholder="What this evidence is and what it shows"
              value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <select aria-label="Source type" className={sel} value={f.source_type} onChange={(e) => setF({ ...f, source_type: e.target.value })}>
              {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.authored_by_subject} onChange={(e) => setF({ ...f, authored_by_subject: e.target.checked })} />
              Authored by the subject company
            </label>
            <Input aria-label="Source reference" className="sm:col-span-2" placeholder="Source reference (URL, list and query, file name, date)"
              value={f.source_ref} onChange={(e) => setF({ ...f, source_ref: e.target.value })} />
            <Input aria-label="Indicators supported" placeholder="Indicators supported, e.g. D1.1 D1.2" value={f.indicators} onChange={(e) => setF({ ...f, indicators: e.target.value })} />
            <Input aria-label="Red lines supported" placeholder="Red lines supported, e.g. H1 S1" value={f.gates} onChange={(e) => setF({ ...f, gates: e.target.value })} />
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button onClick={add} disabled={!f.description}>Record evidence</Button>
              {msg && <span className="text-sm text-red-600">{msg}</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ gates
function GateRow({ eng, code, spec, onSaved }: {
  eng: EngagementDetail; code: string; spec: Methodology["gates"][string]; onSaved: () => void;
}) {
  const cur = eng.gate_results.find((g) => g.code === code);
  const [status, setStatus] = useState<GateStatus>(cur?.status ?? "unknown");
  const [basis, setBasis] = useState(cur?.basis ?? "");
  const [msg, setMsg] = useState("");
  const locked = LOCKED.has(eng.stage);
  const dirty = status !== (cur?.status ?? "unknown") || basis !== (cur?.basis ?? "");
  const save = async () => {
    setMsg("");
    try { await engagementsApi.recordGate(eng.id, code, { status, basis: basis || null }); onSaved(); }
    catch (e) { setMsg(errMsg(e)); }
  };
  return (
    <tr className={status === "triggered" ? "bg-red-50/60" : ""}>
      <td className="px-3 py-2 font-mono text-xs align-top">{code}</td>
      <td className="px-3 py-2 align-top">
        {spec.name}
        <div className="text-xs text-muted-foreground">{spec.kind === "hard" ? "Hard: rating becomes T4" : `Soft: best tier ${spec.cap}`}</div>
      </td>
      <td className="px-3 py-2 align-top">
        <select aria-label={`${code} status`} className={sel} value={status} disabled={locked} onChange={(e) => setStatus(e.target.value as GateStatus)}>
          <option value="unknown">Not checked</option>
          <option value="clear">Clear</option>
          <option value="triggered">Triggered</option>
        </select>
      </td>
      <td className="px-3 py-2 align-top">
        <Input aria-label={`${code} basis`} placeholder="What was checked, against which source" value={basis} disabled={locked} onChange={(e) => setBasis(e.target.value)} />
        {cur && <div className="mt-1 text-xs text-muted-foreground">Checked {new Date(cur.checked_at).toLocaleString()} by {cur.checked_by}</div>}
        {msg && <div className="text-xs text-red-600">{msg}</div>}
      </td>
      <td className="px-3 py-2 align-top text-right">
        {!locked && <Button size="sm" variant={dirty ? "default" : "outline"} onClick={save} disabled={!dirty}>Save</Button>}
      </td>
    </tr>
  );
}

// ------------------------------------------------------------------ indicators
function IndicatorRow({ eng, code, name, anchor, onSaved }: {
  eng: EngagementDetail; code: string; name: string; anchor?: Methodology["anchors"][string]; onSaved: () => void;
}) {
  const cur = eng.indicator_scores.find((s) => s.code === code);
  const init = (s?: IndicatorScore) => ({
    inherent: s ? String(s.inherent_level) : "", residual: s?.residual_level != null ? String(s.residual_level) : "",
    grade: (s?.evidence_grade ?? "") as Grade | "", mitigation: s?.mitigation ?? "",
    mgrade: (s?.mitigation_grade ?? "") as Grade | "", enforceable: s?.mitigation_enforceable ?? false, rationale: s?.rationale ?? "",
  });
  const [f, setF] = useState(init(cur));
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState(false);
  const [msg, setMsg] = useState("");
  const locked = LOCKED.has(eng.stage);
  useEffect(() => setF(init(cur)), [cur?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setMsg("");
    try {
      await engagementsApi.scoreIndicator(eng.id, code, {
        inherent_level: Number(f.inherent), residual_level: f.residual === "" ? null : Number(f.residual),
        evidence_grade: f.grade as Grade, mitigation: f.mitigation || null, mitigation_grade: (f.mgrade || null) as Grade | null,
        mitigation_enforceable: f.enforceable, rationale: f.rationale || null,
      });
      onSaved();
    } catch (e) { setMsg(errMsg(e)); }
  };
  const levels = [0, 1, 2, 3, 4];

  return (
    <div className="border-b last:border-b-0 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs w-10">{code}</span>
        <span className="flex-1 min-w-48 text-sm">{name}</span>
        <select aria-label={`${code} inherent level`} className={sel} value={f.inherent} disabled={locked} onChange={(e) => setF({ ...f, inherent: e.target.value })}>
          <option value="">Level…</option>
          {levels.map((l) => <option key={l} value={l}>Level {l}</option>)}
        </select>
        <select aria-label={`${code} evidence grade`} className={sel} value={f.grade} disabled={locked} onChange={(e) => setF({ ...f, grade: e.target.value as Grade })}>
          <option value="">Evidence…</option>
          {GRADES.map((g) => <option key={g} value={g}>{GRADE_HINT[g]}</option>)}
        </select>
        <Button variant="ghost" size="sm" onClick={() => setGuide((v) => !v)} aria-expanded={guide}>{guide ? "Hide guide" : "Scoring guide"}</Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>{open ? "Less" : "Mitigation & notes"}</Button>
        {!locked && <Button size="sm" onClick={save} disabled={f.inherent === "" || !f.grade}>Save</Button>}
        {(() => {
          const sup = eng.grade_support?.[code];
          if (!sup) return null;
          const over = f.grade && Number(f.grade[1]) < Number(sup.best[1]);
          return (
            <span className={`text-xs ${over ? "text-red-600 font-medium" : "text-muted-foreground"}`}
              title="§5.3: E1 needs 2+ linked evidence items incl. one not authored by the Subject; E2 needs one independent item; E3 any evidence.">
              evidence {sup.items} ({sup.independent} indep.) → up to {sup.best}
            </span>
          );
        })()}
        {(() => {
          const ai = eng.ai?.scoring?.suggestions?.[code];
          if (!ai) return null;
          const far = cur && ai.level != null && Math.abs(cur.inherent_level - ai.level) >= 2;
          return (
            <button type="button" onClick={() => setOpen(true)}
              className={`rounded border px-1.5 py-0.5 text-xs ${far ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-200 text-muted-foreground"}`}
              title={`${ai.reasons}${ai.missing ? ` · Missing: ${ai.missing}` : ""}`}>
              AI: {ai.level == null ? "no level" : `L${ai.level}`} · ≤{ai.max_grade}
            </button>
          );
        })()}
        {cur ? <Badge variant="outline">Saved</Badge> : <Badge variant="outline" className="text-muted-foreground">Not scored</Badge>}
      </div>
      {anchor && f.inherent !== "" && !guide && (
        <p className="mt-2 pl-12 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Level {f.inherent}:</span> {anchor.levels[f.inherent]}
          {f.grade === "E4" && <span className="text-red-700"> · E4 evidence scores level 4 regardless.</span>}
        </p>
      )}
      {anchor && guide && (
        <div className="mt-3 ml-12 rounded-md border bg-muted/40 p-3 text-sm space-y-2">
          {anchor.evidence && <p><span className="font-medium">Evidence:</span> {anchor.evidence}</p>}
          <ol className="space-y-1.5">
            {["0", "1", "2", "3", "4"].map((l) => (
              <li key={l} className={`flex gap-2 rounded px-1 ${f.inherent === l ? "bg-primary/10" : ""}`}>
                <span className="font-mono w-16 shrink-0 whitespace-nowrap">Level {l}</span>
                <span>{anchor.levels[l]}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Assign the lowest level whose description is fully met. “→” notes the red line that also applies.</p>
        </div>
      )}
      {open && eng.ai?.scoring?.suggestions?.[code] && (() => {
        const ai = eng.ai.scoring!.suggestions[code];
        return (
          <div className="mt-3 ml-12 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
            <span className="font-medium">AI suggestion (blind, advisory):</span> {ai.level == null ? "evidence does not support a level" : `Level ${ai.level}`}, evidence up to {ai.max_grade}, {ai.confidence} confidence. {ai.reasons}
            {ai.missing && <> <span className="font-medium">Would settle it:</span> {ai.missing}</>}
          </div>
        );
      })()}
      {open && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 pl-12">
          <Input aria-label={`${code} mitigation`} className="sm:col-span-2" placeholder="Mitigation (what lowers the level, and the agreement condition that enforces it)"
            value={f.mitigation} disabled={locked} onChange={(e) => setF({ ...f, mitigation: e.target.value })} />
          <select aria-label={`${code} residual level`} className={sel} value={f.residual} disabled={locked} onChange={(e) => setF({ ...f, residual: e.target.value })}>
            <option value="">Residual = inherent (no mitigation)</option>
            {levels.map((l) => <option key={l} value={l}>Residual level {l}</option>)}
          </select>
          <select aria-label={`${code} mitigation evidence`} className={sel} value={f.mgrade} disabled={locked} onChange={(e) => setF({ ...f, mgrade: e.target.value as Grade })}>
            <option value="">Mitigation evidence…</option>
            {GRADES.map((g) => <option key={g} value={g}>{GRADE_HINT[g]}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={f.enforceable} disabled={locked} onChange={(e) => setF({ ...f, enforceable: e.target.checked })} />
            Mitigation is enforceable (a condition in the relying party&apos;s agreement, or a CFIUS agreement in good standing)
          </label>
          <Textarea aria-label={`${code} rationale`} className="sm:col-span-2" rows={2} placeholder="Rationale: which anchor is met, and by what evidence"
            value={f.rationale} disabled={locked} onChange={(e) => setF({ ...f, rationale: e.target.value })} />
        </div>
      )}
      {msg && <p className="mt-2 pl-12 text-sm text-red-600">{msg}</p>}
      {cur && <p className="mt-1 pl-12 text-xs text-muted-foreground">Last saved by {cur.scored_by}, {new Date(cur.updated_at).toLocaleString()}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ report inputs
function ReportInputs({ eng, onSaved }: { eng: EngagementDetail; onSaved: (e: EngagementDetail) => void }) {
  const [outlook, setOutlook] = useState<Outlook | "">(eng.outlook ?? "");
  const [conditions, setConditions] = useState(eng.conditions.join("\n"));
  const [reply, setReply] = useState(eng.subject_reply ?? "");
  const [findings, setFindings] = useState<StatutoryFinding[]>(eng.statutory_findings);
  const [nf, setNf] = useState<StatutoryFinding>({ jurisdiction: "", test: "", result: "not_determined", basis: "" });
  const [msg, setMsg] = useState("");
  const locked = LOCKED.has(eng.stage);
  const RESULT: Record<StatutoryFinding["result"], string> = { meets: "Meets definition", does_not_meet: "Does not meet definition", not_determined: "Not determined" };

  const save = async (fs = findings) => {
    setMsg("");
    try {
      onSaved(await engagementsApi.update(eng.id, {
        outlook: (outlook || null) as Outlook | null,
        conditions: conditions.split("\n").map((s) => s.trim()).filter(Boolean),
        subject_reply: reply || null,
        statutory_findings: fs,
      }));
      setMsg("Saved.");
    } catch (e) { setMsg(errMsg(e)); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="outline"><Link href={`/evaluator/engagements/${eng.id}/report`}>Open restricted report</Link></Button>
          <Button asChild variant="outline"><Link href={`/evaluator/engagements/${eng.id}/report?view=public`}>Open public summary</Link></Button>
          <span className="text-sm text-muted-foreground">
            {eng.rating_snapshot ? "Reports show the rating frozen at issue." : "Not issued: reports are marked DRAFT and show the live rating."}
          </span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="outlook">Outlook (12–24 months; required to issue)</Label>
            <select id="outlook" className={sel} value={outlook} disabled={locked} onChange={(e) => setOutlook(e.target.value as Outlook)}>
              <option value="">Not set</option>
              <option value="stable">Stable</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="conditions">Recommended agreement conditions (§8.5), one per line</Label>
            <Textarea id="conditions" rows={5} disabled={locked} value={conditions} onChange={(e) => setConditions(e.target.value)}
              placeholder={"Change-of-control notice within 10 business days, triggering re-assessment\nUS-only data residency with US-side audit rights"} />
            {!locked && eng.ai_processing_allowed && <ConditionDrafts eng={eng} onAdd={(t) => setConditions((c) => (c.trim() ? `${c.trim()}\n${t}` : t))} />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reply">Subject&apos;s right-of-reply response (Stage 6)</Label>
            <Textarea id="reply" rows={3} disabled={locked} value={reply} onChange={(e) => setReply(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => save()} disabled={locked}>Save report inputs</Button>
            {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Statutory eligibility (§8.3)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">One row per relying jurisdiction&apos;s test. Legal determinations should cite the counsel opinion relied on. A favorable tier never overrides a statutory bar.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>{["Jurisdiction", "Test", "Result", "Basis", ""].map((h, i) => <th key={i} className="px-2 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {findings.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-muted-foreground">No findings recorded.</td></tr>}
                {findings.map((f, i) => (
                  <tr key={i}>
                    <td className="px-2 py-2">{f.jurisdiction}</td><td className="px-2 py-2">{f.test}</td>
                    <td className="px-2 py-2">{RESULT[f.result]}</td><td className="px-2 py-2">{f.basis ?? "—"}</td>
                    <td className="px-2 py-2 text-right">
                      {!locked && <Button variant="ghost" size="sm" onClick={() => { const fs = findings.filter((_, j) => j !== i); setFindings(fs); save(fs); }}>Remove</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!locked && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input aria-label="Jurisdiction" placeholder="Jurisdiction" value={nf.jurisdiction} onChange={(e) => setNf({ ...nf, jurisdiction: e.target.value })} />
              <Input aria-label="Test" placeholder="Statutory test / definition" value={nf.test} onChange={(e) => setNf({ ...nf, test: e.target.value })} />
              <select aria-label="Result" className={sel} value={nf.result} onChange={(e) => setNf({ ...nf, result: e.target.value as StatutoryFinding["result"] })}>
                {Object.entries(RESULT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Input aria-label="Basis" placeholder="Basis (counsel opinion, evidence)" value={nf.basis ?? ""} onChange={(e) => setNf({ ...nf, basis: e.target.value })} />
              <div className="sm:col-span-2 lg:col-span-4">
                <Button variant="outline" disabled={!nf.jurisdiction || !nf.test}
                  onClick={() => { const fs = [...findings, { ...nf, basis: nf.basis || null }]; setFindings(fs); setNf({ jurisdiction: "", test: "", result: "not_determined", basis: "" }); save(fs); }}>
                  Add finding
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ committee
function Committee({ eng, m, onSaved }: { eng: EngagementDetail; m: Methodology; onSaved: (e: EngagementDetail) => void }) {
  const [decision, setDecision] = useState<"approve" | "return">("approve");
  const [members, setMembers] = useState("");
  const [externals, setExternals] = useState<ExternalMember[]>([]);
  const internalCount = 1 + members.split(",").map((x) => x.trim()).filter(Boolean).length;
  const total = internalCount + externals.length;
  const [rationale, setRationale] = useState("");
  const [dissent, setDissent] = useState("");
  const [msg, setMsg] = useState("");
  const locked = LOCKED.has(eng.stage);
  const submit = async () => {
    setMsg("");
    try {
      onSaved(await engagementsApi.committee(eng.id, {
        decision, rationale, dissent: dissent || null,
        members: members.split(",").map((s) => s.trim()).filter(Boolean),
        external_members: externals.filter((x) => x.name.trim()),
      }));
      setRationale(""); setDissent(""); setMsg("Decision recorded.");
    } catch (e) { setMsg(errMsg(e)); }
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-2 text-sm">
          <p><span className="font-medium">Status:</span> {eng.committee_status.reason}.</p>
          <p className="text-muted-foreground">
            The chair records the decision. The lead analyst ({eng.lead_analyst ?? "—"}) can neither chair nor vote.
            Any change to scores, red lines, entities, evidence or weights after an approval makes it stale, and issuing then needs a new decision.
          </p>
        </CardContent>
      </Card>
      {!locked && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Record a decision (you are the chair)</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap gap-4 text-sm">
              {(["approve", "return"] as const).map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <input type="radio" name="decision" checked={decision === d} onChange={() => setDecision(d)} />
                  {d === "approve" ? `Approve the current rating (${eng.rating.tier ?? "incomplete"}, ${eng.rating.confidence ?? "—"} confidence)` : "Return to the analyst"}
                </label>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="members">Other committee members (evaluator emails, comma-separated)</Label>
              <Input id="members" value={members} onChange={(e) => setMembers(e.target.value)} placeholder="name@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Independent external members (§11)</Label>
              {externals.map((x, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] items-center">
                  <Input placeholder="Name" value={x.name} onChange={(e) => setExternals(externals.map((y, j) => j === i ? { ...y, name: e.target.value } : y))} />
                  <Input placeholder="Affiliation / role" value={x.affiliation} onChange={(e) => setExternals(externals.map((y, j) => j === i ? { ...y, affiliation: e.target.value } : y))} />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={x.independence_confirmed} onChange={(e) => setExternals(externals.map((y, j) => j === i ? { ...y, independence_confirmed: e.target.checked } : y))} />
                    signed independence declaration on file
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => setExternals(externals.filter((_, j) => j !== i))}>Remove</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setExternals([...externals, { name: "", affiliation: "", independence_confirmed: false }])}>Add external member</Button>
              <p className={`text-xs ${total < m.committee_min_members ? "text-amber-700" : "text-muted-foreground"}`}>
                Committee size: {total} (you, {internalCount - 1} evaluator{internalCount === 2 ? "" : "s"}, {externals.length} external). Minimum {m.committee_min_members}.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rationale">Rationale (required)</Label>
              <Textarea id="rationale" rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dissent">Dissent, if any</Label>
              <Textarea id="dissent" rows={2} value={dissent} onChange={(e) => setDissent(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={rationale.trim().length < 10}>Record decision</Button>
              {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Decisions</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {eng.committee_decisions.length === 0 && <p className="text-muted-foreground">None yet.</p>}
          {[...eng.committee_decisions].reverse().map((d) => (
            <div key={d.id} className="rounded-md border p-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={d.decision === "approve" ? "border-green-400 text-green-700" : "border-orange-400 text-orange-700"}>
                  {d.decision === "approve" ? "Approved" : "Returned"}
                </Badge>
                <span>{new Date(d.decided_at).toLocaleString()}</span>
                <span className="text-muted-foreground">rating seen: {d.tier ?? "—"} · {d.confidence ?? "—"}</span>
              </div>
              <p><span className="font-medium">Chair:</span> {d.chair} · <span className="font-medium">Members:</span> {d.members.join(", ")}
                {d.external_members?.length > 0 && <> · <span className="font-medium">External:</span> {d.external_members.map((x) => `${x.name} (${x.affiliation})`).join(", ")}</>}</p>
              <p>{d.rationale}</p>
              {d.dissent && <p className="text-orange-800"><span className="font-medium">Dissent:</span> {d.dissent}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ audit trail
function AuditTrail({ eng }: { eng: EngagementDetail }) {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { engagementsApi.audit(eng.id).then(setRows).catch((e) => setError(errMsg(e))); }, [eng.id, eng.updated_at, eng.indicator_scores.length, eng.gate_results.length, eng.evidence.length]);
  const show = (v: unknown) => (v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
  const diff = (r: AuditEntry) => {
    const keys = Object.keys(r.new ?? {});
    return keys.map((k) => {
      const o = r.old?.[k];
      const n = r.new[k];
      if (r.old && JSON.stringify(o) === JSON.stringify(n)) return null;
      return <div key={k}><span className="font-mono text-xs">{k}</span>: {r.old ? <><s className="text-muted-foreground">{show(o)}</s> → </> : null}{show(n)}</div>;
    });
  };
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>{["When", "Who", "Action", "Item", "Change"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y align-top">
            {rows === null && !error && <tr><td colSpan={5} className="px-3 py-4 text-muted-foreground">Loading…</td></tr>}
            {rows?.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.actor ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                <td className="px-3 py-2">{r.target ?? "—"}</td>
                <td className="px-3 py-2 break-all">{diff(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ document requests (Stage 2, Appendix A)
const DOMAIN_ORDER = ["ALL", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "STATE"];
function DocumentRequests({ eng, m, reload }: { eng: EngagementDetail; m: Methodology; reload: () => void }) {
  const locked = LOCKED.has(eng.stage);
  const [list, setList] = useState<Record<string, RequestTemplate> | null>(null);
  const [rows, setRows] = useState<DocRequest[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [due, setDue] = useState("");
  const [custom, setCustom] = useState({ title: "", description: "", codes: "" });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    engagementsApi.requests(eng.id).then(setRows).catch((e) => setError(errMsg(e)));
  }, [eng.id]);
  useEffect(() => {
    load();
    engagementsApi.requestList().then((r) => setList(r.items)).catch((e) => setError(errMsg(e)));
  }, [load]);

  const issued = new Set((rows ?? []).map((r) => r.template_key).filter(Boolean) as string[]);
  const domainName = (d: string) => d === "ALL" ? "Every production" : d === "STATE" ? "State-law eligibility" : `${d} ${m.domains[d]?.name ?? ""}`;
  const run = async (f: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await f(); load(); reload(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const issue = () => run(async () => {
    await engagementsApi.issueRequests(eng.id, { template_keys: [...picked], due_date: due ? new Date(due).toISOString() : null });
    setPicked(new Set());
  });
  const issueCustom = () => run(async () => {
    const codes = custom.codes.split(/[\s,]+/).filter(Boolean);
    await engagementsApi.issueRequests(eng.id, {
      title: custom.title, description: custom.description || undefined,
      indicator_codes: codes.filter((c) => c in m.indicators), gate_codes: codes.filter((c) => c in m.gates),
      due_date: due ? new Date(due).toISOString() : null,
    });
    setCustom({ title: "", description: "", codes: "" });
  });
  const review = (r: DocRequest, action: "accept" | "return" | "waive") =>
    run(() => engagementsApi.reviewRequest(eng.id, r.id, { action, note: notes[r.id] }));
  const [sent, setSent] = useState("");
  const awaiting = (rows ?? []).filter((r) => r.status === "open" || r.status === "returned").length;
  const notify = () => run(async () => {
    const res = await fetch(`/api/evaluator/engagements/${eng.id}/notify`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail ?? "Email failed");
    setSent(`Emailed ${body.to} about ${body.count} request(s).`);
  });
  const counts = (rows ?? []).reduce<Record<string, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {});

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Requests ({rows?.length ?? 0})</CardTitle>
          <p className="text-sm text-muted-foreground">
            The company sees these on its dashboard and answers each with documents under an officer attestation, or refuses.
            Accepting a response records it as subject-authored evidence linked to the listed indicators and red lines.
            A refusal you accept is recorded as a finding (grade it E4).
          </p>
          {!locked && awaiting > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" variant="outline" disabled={busy} onClick={notify}>Email the company ({awaiting} awaiting)</Button>
              <span className="text-xs text-muted-foreground">Sends the list in English and Chinese with a link to respond.</span>
              {sent && <span className="text-xs text-green-700">{sent}</span>}
            </div>
          )}
          {rows && rows.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {Object.entries(counts).map(([k, v]) => `${REQUEST_STATUS_LABEL[k as keyof typeof REQUEST_STATUS_LABEL]} ${v}`).join(" · ")}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
          {rows?.length === 0 && <p className="text-sm text-muted-foreground">No requests issued yet. Pick items from the request list below.</p>}
          {rows?.map((r) => (
            <div key={r.id} className="rounded-md border p-3 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.title}</p>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {[...r.indicator_codes, ...r.gate_codes].join(" ") || "No linked codes"}
                    {r.due_date && ` · due ${new Date(r.due_date).toLocaleDateString()}`}
                  </p>
                </div>
                <Badge variant="outline" className={REQUEST_STATUS_CLASS[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
              </div>
              {(r.status === "submitted" || r.status === "accepted") && (
                <div className="text-sm space-y-1">
                  <p className="font-medium">Documents</p>
                  <ul className="list-disc pl-5">
                    {r.document_ids.map((d) => (
                      <li key={d}><a className="text-primary hover:underline" href={`/api/documents/${d}/file`} target="_blank" rel="noreferrer">Download {d.slice(0, 8)}</a></li>
                    ))}
                  </ul>
                  {r.attestation && (
                    <p className="text-xs text-muted-foreground">
                      Attested by {r.attestation.signer_name}, {r.attestation.signer_title} ({r.attestation.email}) on {new Date(r.attestation.attested_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {r.company_note && <p className="text-sm"><span className="font-medium">{r.status === "refused" || (r.status === "accepted" && !r.document_ids.length) ? "Reason for refusal" : "Company note"}:</span> {r.company_note}</p>}
              {r.reviewer_note && <p className="text-sm"><span className="font-medium">Review note:</span> {r.reviewer_note} <span className="text-xs text-muted-foreground">— {r.reviewed_by}</span></p>}
              {!locked && (
                <div className="flex flex-wrap items-center gap-2">
                  {(r.status === "submitted" || r.status === "refused") && (
                    <>
                      <Input className="h-8 max-w-sm" placeholder="Note to the company (required to return)" value={notes[r.id] ?? ""}
                        onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                      <Button size="sm" disabled={busy} onClick={() => review(r, "accept")}>{r.status === "refused" ? "Record refusal as finding" : "Accept as evidence"}</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => review(r, "return")}>Return</Button>
                    </>
                  )}
                  {r.status !== "accepted" && r.status !== "waived" && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => review(r, "waive")}>Waive</Button>
                  )}
                  {r.status === "open" && !r.submitted_at && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => engagementsApi.withdrawRequest(eng.id, r.id))}>Withdraw</Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!locked && list && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Issue from the Document Request List (Appendix A)</CardTitle>
            <p className="text-sm text-muted-foreground">Scale the list to the project overlay. Items already issued are greyed out.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {DOMAIN_ORDER.map((d) => {
              const items = Object.entries(list).filter(([, t]) => t.domain === d);
              if (!items.length) return null;
              return (
                <div key={d}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{domainName(d)}</p>
                    <button type="button" className="text-xs text-primary hover:underline" onClick={() => {
                      const next = new Set(picked); items.forEach(([k]) => !issued.has(k) && next.add(k)); setPicked(next);
                    }}>select all</button>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {items.map(([k, t]) => (
                      <label key={k} className={`flex items-start gap-2 text-sm ${issued.has(k) ? "text-muted-foreground" : ""}`} title={t.description}>
                        <input type="checkbox" className="mt-1" disabled={issued.has(k)} checked={issued.has(k) || picked.has(k)}
                          onChange={(e) => { const n = new Set(picked); if (e.target.checked) n.add(k); else n.delete(k); setPicked(n); }} />
                        <span>{t.title} <span className="text-xs text-muted-foreground">{[...t.indicators, ...t.gates].join(" ")}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap items-end gap-3 border-t pt-3">
              <div className="space-y-1">
                <Label htmlFor="due">Due date (optional)</Label>
                <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-9" />
              </div>
              <Button disabled={busy || picked.size === 0} onClick={issue}>Issue {picked.size || ""} request{picked.size === 1 ? "" : "s"}</Button>
            </div>
            <div className="border-t pt-3 space-y-2">
              <p className="text-sm font-medium">Custom request</p>
              <Input placeholder="Title, e.g. Board minutes 2023-2025" value={custom.title} onChange={(e) => setCustom({ ...custom, title: e.target.value })} />
              <Textarea placeholder="What exactly to provide" value={custom.description} onChange={(e) => setCustom({ ...custom, description: e.target.value })} />
              <Input placeholder="Indicator / red-line codes, e.g. D1.3 S2" value={custom.codes} onChange={(e) => setCustom({ ...custom, codes: e.target.value })} />
              <Button variant="outline" disabled={busy || custom.title.trim().length < 3} onClick={issueCustom}>Issue custom request</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ monitoring (§9)
const ACTIONS: { action: ReviewActionName; label: string; from: string[]; hint: string }[] = [
  { action: "start", label: "Place Under Review", from: ["issued"], hint: "A §9 trigger occurred. Resolve within 90 days." },
  { action: "affirm", label: "Affirm rating", from: ["under_review"], hint: "Review found no change to the rating." },
  { action: "reopen", label: "Reopen for re-rating", from: ["issued", "under_review"], hint: "Back to scoring; the issued rating is withdrawn from the report until the committee approves and you issue again." },
  { action: "withdraw", label: "Withdraw rating", from: ["issued", "under_review"], hint: "Relying Parties must be notified." },
  { action: "expire", label: "Expire now", from: ["issued", "under_review"], hint: "e.g. change of control (§9)." },
];
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

function Monitoring({ eng, onSaved }: { eng: EngagementDetail; onSaved: (e: EngagementDetail) => void }) {
  const [cfg, setCfg] = useState<MonitoringConfig | null>(null);
  const [events, setEvents] = useState<MonitoringEvent[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [action, setAction] = useState<ReviewActionName | "">("");
  const [trigger, setTrigger] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    engagementsApi.events({ engagement_id: eng.id, include_acknowledged: showAll }).then(setEvents).catch((e) => setError(errMsg(e)));
  }, [eng.id, showAll]);
  useEffect(() => { load(); }, [load, eng.stage]);
  useEffect(() => { engagementsApi.monitoringConfig().then(setCfg).catch(() => {}); }, []);

  const go = async (f: () => Promise<void>) => {
    setBusy(true); setError(""); setMsg("");
    try { await f(); load(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const bringDown = () => go(async () => {
    const r = await engagementsApi.bringDown(eng.id);
    setMsg(`Re-screened ${new Date(r.screened_at).toLocaleString()}: ${r.events.length} new event(s).`);
    onSaved(await engagementsApi.get(eng.id));
  });
  const doAction = () => go(async () => {
    if (!action) return;
    onSaved(await engagementsApi.review(eng.id, { action, trigger: action === "start" ? trigger : undefined, note }));
    setAction(""); setNote(""); setTrigger(""); setMsg("Saved.");
  });
  const available = ACTIONS.filter((a) => a.from.includes(eng.stage));
  const issued = eng.stage === "issued" || eng.stage === "under_review";

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Surveillance status</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid gap-2 sm:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium">{stageLabel(eng.stage)}</p></div>
            <div><p className="text-xs text-muted-foreground">Issued</p><p>{fmtDate(eng.issued_at)}</p></div>
            <div><p className="text-xs text-muted-foreground">Valid until</p><p>{fmtDate(eng.valid_until)}</p></div>
            <div><p className="text-xs text-muted-foreground">Last monitored</p><p>{eng.last_monitored_at ? new Date(eng.last_monitored_at).toLocaleString() : "—"}</p></div>
          </div>
          {eng.review_reason && (
            <p className={eng.stage === "under_review" ? "rounded-md bg-amber-50 p-2 text-amber-900" : "text-muted-foreground"}>
              {eng.stage === "under_review" && <b>Under Review since {fmtDate(eng.review_started_at)}, resolve by {fmtDate(eng.review_due_at)}. </b>}
              {eng.review_reason}
            </p>
          )}
          {!issued && !eng.review_reason && <p className="text-muted-foreground">Monitoring starts when the rating is issued.</p>}
          {issued && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" variant="outline" disabled={busy} onClick={bringDown}>Bring-down re-screen now</Button>
              <span className="text-xs text-muted-foreground">Run at each Relying Party decision point (incentive approval, land closing). Daily monitoring also runs automatically.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {available.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {available.map((a) => (
                <Button key={a.action} size="sm" variant={action === a.action ? "default" : "outline"} onClick={() => setAction(a.action)}>{a.label}</Button>
              ))}
            </div>
            {action && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{ACTIONS.find((a) => a.action === action)?.hint}</p>
                {action === "start" && cfg && (
                  <select className={sel} value={trigger} onChange={(e) => setTrigger(e.target.value)}>
                    <option value="">Trigger (§9)…</option>
                    {Object.entries(cfg.triggers).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                )}
                <Textarea placeholder="What happened and what you are doing about it (recorded in the audit trail)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button size="sm" disabled={busy || note.trim().length < 5 || (action === "start" && !trigger)} onClick={doAction}>
                  Confirm: {ACTIONS.find((a) => a.action === action)?.label}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Alerts</CardTitle>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> show acknowledged
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {events === null && <p className="text-sm text-muted-foreground">Loading…</p>}
          {events?.length === 0 && <p className="text-sm text-muted-foreground">No open alerts.</p>}
          {events?.map((e) => <EventRow key={e.id} e={e} onAck={load} />)}
        </CardContent>
      </Card>

      {cfg && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Watch dates (Appendix B)</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">{cfg.watch_dates.map((w) => <li key={w.date + w.item}><span className="font-mono text-xs">{w.date}</span> {w.item}</li>)}</ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ readiness (§4, §11)
function Readiness({ checks }: { checks: ReadinessCheck[] }) {
  const groups: [string, ReadinessCheck["blocks"]][] = [["Before committee approval", "committee"], ["Before issue", "issue"], ["Warnings", "warning"]];
  const open = checks.filter((c) => !c.ok && c.blocks !== "warning").length;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Readiness {open ? <span className="text-sm font-normal text-amber-700">· {open} to do</span> : <span className="text-sm font-normal text-green-700">· ready</span>}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map(([title, kind]) => {
          const rows = checks.filter((c) => c.blocks === kind);
          if (!rows.length) return null;
          return (
            <div key={kind} className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
              {rows.map((c) => (
                <div key={c.key} className="flex gap-2 text-sm">
                  <span className={c.ok ? "text-green-600" : kind === "warning" ? "text-amber-600" : "text-red-600"}>{c.ok ? "✓" : kind === "warning" ? "!" : "✗"}</span>
                  <div><p className="leading-snug">{c.label}</p><p className="text-xs text-muted-foreground">{c.detail}</p></div>
                </div>
              ))}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ acceptance (Stage 0)
const FEE_STATUSES: FeeStatus[] = ["none", "quoted", "invoiced", "escrowed", "paid"];
function Acceptance({ eng, onSaved }: { eng: EngagementDetail; onSaved: (e: EngagementDetail) => void }) {
  const [f, setF] = useState({
    letter: eng.engagement_letter_signed_at?.slice(0, 10) ?? "", ref: eng.engagement_letter_ref ?? "",
    fee: eng.fee_amount != null ? String(eng.fee_amount) : "", currency: eng.fee_currency, status: eng.fee_status,
    ai: eng.ai_processing_allowed,
  });
  const [letters, setLetters] = useState<RelianceLetter[]>(eng.reliance_letters);
  const [statements, setStatements] = useState<Record<string, string> | null>(null);
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [disclosure, setDisclosure] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { engagementsApi.independenceStatements().then(setStatements).catch(() => {}); }, []);

  const save = async (body: Parameters<typeof engagementsApi.update>[1], done: string) => {
    setError(""); setMsg("");
    try { onSaved(await engagementsApi.update(eng.id, body)); setMsg(done); } catch (e) { setError(errMsg(e)); }
  };
  const saveAcceptance = () => save({
    engagement_letter_signed_at: f.letter ? new Date(f.letter).toISOString() : null, engagement_letter_ref: f.ref || null,
    fee_amount: f.fee === "" ? null : Number(f.fee), fee_currency: f.currency || "USD", fee_status: f.status,
    ai_processing_allowed: f.ai,
  }, "Acceptance record saved.");
  const declare = async () => {
    setError(""); setMsg("");
    try { onSaved(await engagementsApi.declare(eng.id, { statements: mine, disclosure: disclosure || undefined })); setMsg("Declaration filed."); }
    catch (e) { setError(errMsg(e)); }
  };
  const parties = Array.from(new Set([...eng.relying_parties, ...letters.map((l) => l.relying_party)]));
  const letterFor = (p: string) => letters.find((l) => l.relying_party === p) ?? { relying_party: p };
  const setLetter = (p: string, patch: Partial<RelianceLetter>) =>
    setLetters([...letters.filter((l) => l.relying_party !== p), { ...letterFor(p), ...patch }]);

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Engagement letter and fee (§11, §12.1)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Engagement letter signed on</Label><Input type="date" value={f.letter} onChange={(e) => setF({ ...f, letter: e.target.value })} /></div>
            <div className="space-y-1"><Label>Letter reference / file</Label><Input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="e.g. EL-2026-014, signed PDF in Drive" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1"><Label>Flat fee</Label><Input type="number" min="0" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} /></div>
            <div className="space-y-1"><Label>Currency</Label><Input maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} /></div>
            <div className="space-y-1">
              <Label>Fee status</Label>
              <select className={`${sel} w-full`} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as FeeStatus })}>
                {FEE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={f.ai} onChange={(e) => setF({ ...f, ai: e.target.checked })} />
            <span>The engagement letter includes the Subject&apos;s consent to processing by the AI sub-processor (§5.6, §12.1). Required before AI assistance can run.</span>
          </label>
          <p className="text-xs text-muted-foreground">Fees are flat, published and independent of the outcome. They must be paid or escrowed before the committee decides. Analysts never discuss fees with the Subject.</p>
          <Button size="sm" onClick={saveAcceptance}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Independence declarations (§11)</CardTitle>
          <p className="text-sm text-muted-foreground">Everyone who works on or decides this engagement files one: the lead, the second reviewer and every committee member.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {eng.declarations.length === 0 && <p className="text-sm text-muted-foreground">None filed yet.</p>}
          {eng.declarations.map((d) => (
            <p key={d.evaluator} className="text-sm">
              <span className={d.cleared ? "text-green-700" : "text-red-700"}>{d.cleared ? "✓ Cleared" : "✗ Not cleared"}</span> · {d.evaluator} · {new Date(d.declared_at).toLocaleDateString()}
              {d.disclosure && <span className="text-muted-foreground"> · Disclosed: {d.disclosure}</span>}
            </p>
          ))}
          {statements && (
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">File my declaration</p>
              {Object.entries(statements).map(([k, v]) => (
                <label key={k} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={!!mine[k]} onChange={(e) => setMine({ ...mine, [k]: e.target.checked })} />{v}
                </label>
              ))}
              <Textarea placeholder="Anything to disclose (if you can't affirm a statement, explain here)" value={disclosure} onChange={(e) => setDisclosure(e.target.value)} />
              <Button size="sm" onClick={declare}>File declaration</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reliance letters (§3.1, §12.2)</CardTitle>
          <p className="text-sm text-muted-foreground">On the subject-engaged track, release the report to a Relying Party only after it countersigns a reliance letter.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {parties.length === 0 && <p className="text-sm text-muted-foreground">No Relying Parties named (Overview tab).</p>}
          {parties.map((p) => {
            const l = letterFor(p);
            return (
              <div key={p} className="grid gap-2 sm:grid-cols-[1fr_1fr_160px] items-end">
                <div className="text-sm font-medium">{p}</div>
                <Input placeholder="Signed by (name, title)" value={l.signer ?? ""} onChange={(e) => setLetter(p, { signer: e.target.value })} />
                <Input type="date" value={l.countersigned_at?.slice(0, 10) ?? ""} onChange={(e) => setLetter(p, { countersigned_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </div>
            );
          })}
          {parties.length > 0 && <Button size="sm" variant="outline" onClick={() => save({ reliance_letters: letters }, "Reliance letters saved.")}>Save reliance letters</Button>}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ second review & counsel review
function Signoffs({ eng, onSaved }: { eng: EngagementDetail; onSaved: (e: EngagementDetail) => void }) {
  const [kind, setKind] = useState<"second_review" | "counsel_review">("second_review");
  const [note, setNote] = useState("");
  const [counsel, setCounsel] = useState("");
  const [error, setError] = useState("");
  const locked = LOCKED.has(eng.stage);
  const submit = async () => {
    setError("");
    try { onSaved(await engagementsApi.signoff(eng.id, { kind, note, counsel_name: kind === "counsel_review" ? counsel : undefined })); setNote(""); }
    catch (e) { setError(errMsg(e)); }
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Second review and counsel review</CardTitle>
        <p className="text-sm text-muted-foreground">
          The second reviewer (not the lead, and not the committee chair) checks the evidence and scoring. Any rating change afterwards needs a new sign-off.
          Counsel reviews every T3/T4 report before issue.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {eng.signoffs.length === 0 && <p className="text-sm text-muted-foreground">No sign-offs yet.</p>}
        {eng.signoffs.map((x) => (
          <p key={x.id} className="text-sm">
            <b>{x.kind === "second_review" ? "Second review" : `Counsel review (${x.counsel_name})`}</b> · {x.signed_by} · {new Date(x.signed_at).toLocaleString()} · rating seen {x.tier ?? "—"}
            <span className="block text-muted-foreground">{x.note}</span>
          </p>
        ))}
        {!locked && (
          <div className="space-y-2 rounded-md border p-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <select className={sel} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="second_review">I completed the second review</option>
              <option value="counsel_review">Record counsel&apos;s review</option>
            </select>
            {kind === "counsel_review" && <Input placeholder="Counsel's name and firm" value={counsel} onChange={(e) => setCounsel(e.target.value)} />}
            <Textarea placeholder="What was checked, and any points raised" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button size="sm" disabled={note.trim().length < 10} onClick={submit}>Sign off</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ right of reply (Stage 6)
function RightOfReply({ eng, onSaved }: { eng: EngagementDetail; onSaved: (e: EngagementDetail) => void }) {
  const [days, setDays] = useState("14");
  const [error, setError] = useState("");
  const locked = LOCKED.has(eng.stage);
  const [sent, setSent] = useState("");
  const share = async () => {
    setError(""); setSent("");
    try {
      onSaved(await engagementsApi.shareForReply(eng.id, Number(days)));
      try { const r = await engagementsApi.notifyCompany(eng.id, "reply"); setSent(`Emailed ${r.to} with the deadline.`); }
      catch (e) { setError(`Shared, but the email failed: ${errMsg(e)}. The company still sees the findings on its dashboard.`); }
    } catch (e) { setError(errMsg(e)); }
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Right of reply (§4 Stage 6)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Shares the draft factual findings with the Subject in its portal: the entity map, your written findings (indicator rationales) and independent sources.
          Never the levels, grades, red lines or rating. The response appears in the report.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error && <p className="text-red-600">{error}</p>}
        {sent && <p className="text-green-700">{sent}</p>}
        {eng.reply_shared_at ? (
          <p>Shared {new Date(eng.reply_shared_at).toLocaleDateString()} · response due {eng.reply_due_at ? new Date(eng.reply_due_at).toLocaleDateString() : "—"} ·{" "}
            {eng.reply_received_at ? <span className="text-green-700">received {new Date(eng.reply_received_at).toLocaleString()} from {eng.reply_submitted_by}</span> : "awaiting response"}</p>
        ) : <p className="text-muted-foreground">Not shared yet. Write rationales on the Indicators tab first: they are the findings the Subject sees.</p>}
        {eng.reply_received_at && eng.subject_reply && <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3">{eng.subject_reply}</p>}
        {eng.reply_received_at && eng.ai_processing_allowed && <ReplyMapper eng={eng} />}
        {!locked && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1"><Label>Days to respond</Label><Input className="w-24" type="number" min="5" max="60" value={days} onChange={(e) => setDays(e.target.value)} /></div>
            <Button size="sm" variant={eng.reply_shared_at ? "outline" : "default"} onClick={share}>{eng.reply_shared_at ? "Share updated findings" : "Share draft findings"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ AI assistance (§5.6)
function AiAssist({ eng, onSaved }: { eng: EngagementDetail; onSaved: (e: EngagementDetail) => void }) {
  const [busy, setBusy] = useState<"" | "blind_scoring" | "consistency">("");
  const [error, setError] = useState("");
  const run = async (kind: "blind_scoring" | "consistency") => {
    setBusy(kind); setError("");
    try { onSaved(await engagementsApi.aiReview(eng.id, kind)); } catch (e) { setError(errMsg(e)); } finally { setBusy(""); }
  };
  const sc = eng.ai?.scoring, cons = eng.ai?.consistency;
  const SEV: Record<string, string> = { high: "text-red-700", medium: "text-amber-700", low: "text-slate-600" };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">AI assistance <span className="text-xs font-normal text-muted-foreground">· advisory only (§5.6)</span></CardTitle>
        <p className="text-sm text-muted-foreground">
          The blind review reads only the anchors and the evidence register, never your levels or rationale, and suggests a level for each indicator.
          The consistency check reads your scorecard and lists contradictions. Neither changes anything; every run is logged, and the committee sees large differences.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!eng.ai_processing_allowed && <p className="rounded-md bg-amber-50 p-2 text-amber-900">Record the Subject&apos;s consent to AI processing on the Acceptance tab first.</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!!busy || !eng.ai_processing_allowed} onClick={() => run("blind_scoring")}>
            {busy === "blind_scoring" ? "Reviewing 7 domains…" : "Run blind scoring review"}
          </Button>
          <Button size="sm" variant="outline" disabled={!!busy || !eng.ai_processing_allowed || !eng.indicator_scores.length} onClick={() => run("consistency")}>
            {busy === "consistency" ? "Checking…" : "Check scorecard consistency"}
          </Button>
        </div>
        {sc && (
          <div>
            <p className="text-muted-foreground">Blind review {new Date(sc.run_at).toLocaleString()} · {sc.model} · by {sc.by}
              {sc.stale_changes > 0 && <span className="text-amber-700"> · {sc.stale_changes} change(s) since; run again</span>}</p>
            {sc.divergences.length > 0
              ? <p className="text-amber-800">Differences of 2+ levels (address them in your rationale): {sc.divergences.map((d) => `${d.code} you ${d.analyst} / AI ${d.ai}`).join(" · ")}</p>
              : <p className="text-green-700">No indicator differs from the AI reading by 2 or more levels.</p>}
            <p className="text-xs text-muted-foreground">Each indicator shows the AI reading next to your score; click it for the reasons.</p>
          </div>
        )}
        {cons && (
          <div className="space-y-1">
            <p className="text-muted-foreground">Consistency check {new Date(cons.run_at).toLocaleString()} · {cons.model}
              {cons.stale_changes > 0 && <span className="text-amber-700"> · {cons.stale_changes} change(s) since</span>}</p>
            {cons.issues.length === 0 ? <p className="text-green-700">No contradictions found.</p> : (
              <ul className="space-y-1">
                {cons.issues.map((i, k) => (
                  <li key={k} className={SEV[i.severity]}><span className="font-mono text-xs">{i.codes.join(" ")}</span> {i.issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ documents + AI reading (§5.6)
function Documents({ eng, reload }: { eng: EngagementDetail; reload: () => void }) {
  const [docs, setDocs] = useState<EngagementDocument[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const locked = LOCKED.has(eng.stage);
  const load = useCallback(() => { engagementsApi.documents(eng.id).then(setDocs).catch((e) => setError(errMsg(e))); }, [eng.id]);
  useEffect(() => { load(); }, [load]);
  const act = async (key: string, f: () => Promise<unknown>) => {
    setBusy(key); setError("");
    try { await f(); load(); } catch (e) { setError(errMsg(e)); } finally { setBusy(""); }
  };
  const existing = new Set(eng.entities.map((e) => e.name.toLowerCase()));
  const byName = (n: string | null) => eng.entities.find((e) => n && (e.name.toLowerCase() === n.toLowerCase() || e.name_zh === n));
  const addEntity = (d: EngagementDocument, x: NonNullable<EngagementDocument["analysis"]>["entities"][number]) => act(`ent-${x.name}`, async () => {
    await engagementsApi.addEntity(eng.id, {
      name: x.name, name_zh: x.name_zh, role: x.role, parent_id: byName(x.held_by)?.id ?? null, ownership_pct: x.ownership_pct,
      jurisdiction: x.jurisdiction, registry_id: x.registry_id, is_state_linked: x.state_linked,
      notes: `From ${d.filename} (AI reading, confirmed by analyst). Quote: ${x.quote}`,
    });
    setAdded(new Set([...added, `${d.id}:${x.name}`])); reload();
  });
  const Q = ({ ok }: { ok: boolean }) => ok ? null : <span className="ml-1 rounded bg-red-50 px-1 text-[10px] font-medium text-red-700">quote not found in document</span>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-1">
          <p>The company&apos;s documents. <b>Extract text</b> reads a PDF or Word file; <b>AI reading</b> summarizes it in English (it may be in Chinese), lists key facts, owners and possible red flags.</p>
          <p>Every item carries a verbatim quote, and TBRAC checks that the quote really appears in the document; anything flagged “quote not found” must not be relied on. AI output is never evidence: confirm facts in the document itself, and add entities only after checking them.</p>
          {!eng.ai_processing_allowed && <p className="text-amber-800">AI reading needs the Subject&apos;s consent on the Acceptance tab.</p>}
        </CardContent>
      </Card>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {docs === null && <p className="text-sm text-muted-foreground">Loading…</p>}
      {docs?.length === 0 && <p className="text-sm text-muted-foreground">The company has not uploaded any documents.</p>}
      {docs?.map((d) => (
        <Card key={d.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{d.filename}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {d.request ? `For: ${d.request} · ` : ""}{(d.size / 1024).toFixed(0)} KB
                  {d.has_text ? ` · text extracted (${d.text_chars.toLocaleString()} characters${d.page_count ? `, ${d.page_count} pages` : ""}${d.language ? `, ${d.language === "zh" ? "Chinese" : "English"}` : ""})` : ""}
                </p>
                {d.text_problem && <p className="text-xs text-amber-800">{d.text_problem}{!d.ocr && " Try OCR scan."}</p>}
                {d.ocr && !d.text_problem && <p className="text-xs text-muted-foreground">Text read by OCR: check quotes against the scan itself.</p>}
                <AccessLog docId={d.id} />
              </div>
              <div className="flex flex-wrap gap-2">
                <a className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-muted" href={`/api/documents/${d.id}/file`} target="_blank" rel="noreferrer">Open file</a>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act(`x-${d.id}`, () => engagementsApi.extractText(d.id))}>
                  {busy === `x-${d.id}` ? "Extracting…" : d.has_text ? "Re-extract text" : "Extract text"}
                </Button>
                {(d.mime_type.startsWith("image/") || d.text_problem || (d.mime_type === "application/pdf" && !d.has_text)) && (
                  <Button size="sm" variant="outline" disabled={!!busy || !eng.ai_processing_allowed} title="Read a scanned document with the vision model"
                    onClick={() => act(`o-${d.id}`, () => engagementsApi.ocr(eng.id, d.id))}>
                    {busy === `o-${d.id}` ? "Reading scan…" : "OCR scan"}
                  </Button>
                )}
                <Button size="sm" disabled={!!busy || !d.has_text || !!d.text_problem || !eng.ai_processing_allowed} onClick={() => act(`a-${d.id}`, () => engagementsApi.analyzeDocument(eng.id, d.id))}>
                  {busy === `a-${d.id}` ? "Reading…" : d.analysis ? "AI reading again" : "AI reading"}
                </Button>
              </div>
            </div>
          </CardHeader>
          {d.analysis && (
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">AI reading {new Date(d.analysis.run_at).toLocaleString()} · {d.analysis.model} · {d.analysis.document_type}
                {d.analysis.truncated && " · long document: only the first part was read"}</p>
              <p>{d.analysis.summary_en}</p>
              {d.analysis.key_facts.length > 0 && (
                <div>
                  <p className="font-medium">Key facts</p>
                  <ul className="mt-1 space-y-1">{d.analysis.key_facts.map((f, i) => (
                    <li key={i}>{f.fact}<Q ok={f.quote_verified} /><span className="block text-xs text-muted-foreground">“{f.quote}”{f.quote_en && f.quote_en !== f.quote ? ` — ${f.quote_en}` : ""}</span></li>
                  ))}</ul>
                </div>
              )}
              {d.analysis.flags.length > 0 && (
                <div>
                  <p className="font-medium text-amber-800">Possible red flags</p>
                  <ul className="mt-1 space-y-1">{d.analysis.flags.map((f, i) => (
                    <li key={i}><span className="font-mono text-xs">{f.codes.join(" ")}</span> {f.issue}<Q ok={f.quote_verified} /><span className="block text-xs text-muted-foreground">“{f.quote}”</span></li>
                  ))}</ul>
                </div>
              )}
              {d.analysis.entities.length > 0 && (
                <div>
                  <p className="font-medium">Entities and owners found</p>
                  <table className="mt-1 w-full text-xs">
                    <tbody className="divide-y">
                      {d.analysis.entities.map((x, i) => {
                        const done = added.has(`${d.id}:${x.name}`) || existing.has(x.name.toLowerCase());
                        return (
                          <tr key={i} className="align-top">
                            <td className="py-1.5 pr-2"><span className="font-medium">{x.name}</span>{x.name_zh ? ` (${x.name_zh})` : ""}<Q ok={x.quote_verified} />
                              <span className="block text-muted-foreground">“{x.quote}”</span></td>
                            <td className="py-1.5 pr-2">{x.role.replace("_", " ")}{x.held_by ? `, held by ${x.held_by}` : ""}{x.ownership_pct != null ? ` ${x.ownership_pct}%` : ""}</td>
                            <td className="py-1.5 pr-2">{[x.jurisdiction, x.registry_id, x.state_linked ? "state-linked" : null].filter(Boolean).join(" · ")}</td>
                            <td className="py-1.5 text-right">
                              {done ? <span className="text-muted-foreground">in entity map</span> : !locked && (
                                <Button size="sm" variant="outline" disabled={!!busy || !x.quote_verified} title={x.quote_verified ? "Add after checking it against the document" : "Quote not found; add manually if the document supports it"}
                                  onClick={() => addEntity(d, x)}>Add to entity map</Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ methodology version (§13)
function VersionBox({ eng, onSaved }: { eng: EngagementDetail; onSaved: (e: EngagementDetail) => void }) {
  const [published, setPublished] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    engagementsApi.versions().then((d) => setPublished(d.versions.filter((v) => v.status === "published").map((v) => v.version))).catch(() => {});
  }, []);
  const others = published.filter((v) => v !== eng.methodology_version);
  const move = async () => {
    setError("");
    try { onSaved(await engagementsApi.rebase(eng.id, target, reason)); setReason(""); setTarget(""); } catch (e) { setError(errMsg(e)); }
  };
  return (
    <Card>
      <CardContent className="pt-6 space-y-2 text-sm">
        <p>Scored under methodology <span className="font-mono font-semibold">{eng.methodology_version}</span>
          {eng.rating.weights && Object.keys(eng.rating.weights).length > 0 && (
            <span className="text-muted-foreground"> · weights {Object.entries(eng.rating.weights).map(([d, w]) => `${d} ${(w * 100).toFixed(0)}%`).join(", ")}</span>
          )}</p>
        {!LOCKED.has(eng.stage) && others.length > 0 && (
          <div className="flex flex-wrap items-end gap-2">
            <select className={sel} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Move to version…</option>
              {others.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <Input className="h-9 max-w-sm" placeholder="Reason (recorded; needs a fresh second review and committee decision)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button size="sm" variant="outline" disabled={!target || reason.trim().length < 10} onClick={move}>Move</Button>
          </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ AI helpers: conditions, reply mapping (§5.6)
function ConditionDrafts({ eng, onAdd }: { eng: EngagementDetail; onAdd: (text: string) => void }) {
  const [res, setRes] = useState<DraftedConditions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [used, setUsed] = useState<Set<number>>(new Set());
  const draft = async () => {
    setBusy(true); setError("");
    try { setRes(await engagementsApi.aiConditions(eng.id)); setUsed(new Set()); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2 rounded-md border border-dashed p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={busy || !eng.indicator_scores.length} onClick={draft}>{busy ? "Drafting…" : "Draft conditions with AI"}</Button>
        <span className="text-xs text-muted-foreground">Suggestions from your findings, drafted as objective facts (§8.5). Add the ones you want, then edit and save.</span>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {res?.conditions.length === 0 && <p className="text-muted-foreground">No conditions suggested.</p>}
      {res?.conditions.map((c, i) => (
        <div key={i} className="flex items-start justify-between gap-3 border-t pt-2">
          <div><p>{c.text}</p><p className="text-xs text-muted-foreground"><span className="font-mono">{c.codes.join(" ")}</span> {c.why}</p></div>
          <Button size="sm" variant="ghost" disabled={used.has(i)} onClick={() => { onAdd(c.text); setUsed(new Set([...used, i])); }}>{used.has(i) ? "Added" : "Add"}</Button>
        </div>
      ))}
    </div>
  );
}

function ReplyMapper({ eng }: { eng: EngagementDetail }) {
  const [res, setRes] = useState<ReplyMap | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async () => {
    setBusy(true); setError("");
    try { setRes(await engagementsApi.aiReplyMap(eng.id)); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const KIND: Record<string, string> = { correction: "Correction", objection: "Objection", new_fact: "New fact", agreement: "Agrees" };
  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={run}>{busy ? "Mapping…" : "Map reply to findings (AI)"}</Button>
        <span className="text-xs text-muted-foreground">Lists each correction and the finding it concerns, so none is missed. It does not judge who is right.</span>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {res && (
        <table className="w-full text-xs">
          <tbody className="divide-y">
            {res.items.map((it, i) => (
              <tr key={i} className="align-top">
                <td className="py-1.5 pr-2 whitespace-nowrap font-medium">{KIND[it.kind] ?? it.kind}</td>
                <td className="py-1.5 pr-2">{it.code ? <span className="font-mono">{it.code} </span> : null}{it.concerns}{it.is_entity && " (entity)"}</td>
                <td className="py-1.5 pr-2">{it.summary}<span className="block text-muted-foreground">“{it.quote}”{!it.quote_verified && <span className="ml-1 rounded bg-red-50 px-1 text-[10px] font-medium text-red-700">quote not found in reply</span>}</span></td>
                <td className="py-1.5 text-muted-foreground">{it.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ self-assessment intake (§4 Stage 1, Appendix D)
function IntakePanel({ eng }: { eng: EngagementDetail }) {
  const [data, setData] = useState<Intake | null>(null);
  const [all, setAll] = useState(false);
  useEffect(() => { engagementsApi.intake(eng.id).then(setData).catch(() => setData(null)); }, [eng.id]);
  if (!data) return null;
  if (!data.assessment) return null;
  const text = (moduleKey: string, qid: string) => getModuleByKey(moduleKey)?.questions.find((q) => q.id === qid)?.text ?? qid;
  const rows = data.answers.filter((a) => all || a.low);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Self-assessment intake</CardTitle>
        <p className="text-sm text-muted-foreground">
          The company&apos;s own answers ({data.assessment.linked ? "the self-assessment it requested from" : "its latest submitted self-assessment"}
          {data.assessment.submitted_at ? `, submitted ${new Date(data.assessment.submitted_at).toLocaleDateString()}` : ""}), routed by Appendix D to what they inform.
          Use them to decide where to look first. They are never evidence above E3.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {data.red_flags.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2">
            <p className="font-medium text-red-800">Self-reported red flags</p>
            <ul className="list-disc pl-5 text-red-800">{data.red_flags.map((f) => <li key={f.question_id}>{f.label} <span className="text-xs">({f.question_id}, {f.severity})</span></li>)}</ul>
          </div>
        )}
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> show all {data.answers.length} answers (default: low answers only, 4 or below out of 10)
        </label>
        {rows.length === 0 ? <p className="text-muted-foreground">No low answers.</p> : (
          <table className="w-full text-xs">
            <tbody className="divide-y">
              {rows.map((a) => (
                <tr key={a.question_id} className="align-top">
                  <td className="py-1.5 pr-2 font-mono text-muted-foreground">{a.question_id}</td>
                  <td className="py-1.5 pr-2">{text(a.module_key, a.question_id)}</td>
                  <td className={`py-1.5 pr-2 whitespace-nowrap font-semibold ${a.low ? "text-red-700" : ""}`}>{a.value}/10</td>
                  <td className="py-1.5 whitespace-nowrap font-mono">{a.feeds.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ confidential document access log
function AccessLog({ docId }: { docId: string }) {
  const [rows, setRows] = useState<{ at: string; actor: string | null; action: string }[] | null>(null);
  const [open, setOpen] = useState(false);
  const load = () => { setOpen(!open); if (!rows) engagementsApi.documentAccess(docId).then(setRows).catch(() => setRows([])); };
  return (
    <div className="text-xs">
      <button type="button" className="text-muted-foreground hover:underline" onClick={load}>{open ? "Hide access log" : "Who has opened this document"}</button>
      {open && rows && (
        <ul className="mt-1 space-y-0.5 text-muted-foreground">
          {rows.length === 0 && <li>No evaluator access recorded.</li>}
          {rows.map((r, i) => <li key={i}>{new Date(r.at).toLocaleString()} · {r.actor ?? "—"}</li>)}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ page
export default function EngagementWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [eng, setEng] = useState<EngagementDetail | null>(null);
  const [m, setM] = useState<Methodology | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    engagementsApi.get(id).then(setEng).catch((e) => setError(errMsg(e)));
  }, [id]);
  useEffect(() => {
    reload();
    engagementsApi.methodology().then(setM).catch((e) => setError(errMsg(e)));
  }, [reload]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="flex gap-4 text-sm">
          <Link href="/evaluator/engagements" className="text-primary hover:underline">← All engagements</Link>
          <Link href="/evaluator/guide" className="text-muted-foreground hover:underline">How to run an engagement</Link>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {(!eng || !m) && !error && <p className="text-muted-foreground">Loading…</p>}
        {eng && m && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{eng.customer_name}</h1>
                <p className="text-muted-foreground">
                  <span className="capitalize">{eng.engagement_type}</span> assessment · {eng.track.replace("_", "-")} · lead {eng.lead_analyst ?? "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{stageLabel(eng.stage)}</Badge>
                {LOCKED.has(eng.stage) && <Badge variant="outline">Locked</Badge>}
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <Tabs defaultValue="indicators">
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="acceptance">Acceptance</TabsTrigger>
                  <TabsTrigger value="entities">Entity map ({eng.entities.length})</TabsTrigger>
                  <TabsTrigger value="requests">Document requests</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence ({eng.evidence.length})</TabsTrigger>
                  <TabsTrigger value="gates">Red lines</TabsTrigger>
                  <TabsTrigger value="indicators">Indicators</TabsTrigger>
                  <TabsTrigger value="reply">Right of reply</TabsTrigger>
                  <TabsTrigger value="report">Report</TabsTrigger>
                  <TabsTrigger value="committee">Committee</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                  <TabsTrigger value="audit">Audit trail</TabsTrigger>
                </TabsList>
                <TabsContent value="committee" className="space-y-4"><Signoffs eng={eng} onSaved={setEng} /><Committee eng={eng} m={m} onSaved={setEng} /></TabsContent>
                <TabsContent value="acceptance"><Acceptance eng={eng} onSaved={setEng} /></TabsContent>
                <TabsContent value="reply"><RightOfReply eng={eng} onSaved={setEng} /></TabsContent>
                <TabsContent value="audit"><AuditTrail eng={eng} /></TabsContent>
                <TabsContent value="monitoring"><Monitoring eng={eng} onSaved={setEng} /></TabsContent>
                <TabsContent value="report"><ReportInputs eng={eng} onSaved={setEng} /></TabsContent>
                <TabsContent value="overview" className="space-y-4"><VersionBox eng={eng} onSaved={setEng} /><Overview eng={eng} m={m} onSaved={setEng} /><IntakePanel eng={eng} /></TabsContent>
                <TabsContent value="entities"><Entities eng={eng} reload={reload} /></TabsContent>
                <TabsContent value="documents"><Documents eng={eng} reload={reload} /></TabsContent>
                <TabsContent value="requests"><DocumentRequests eng={eng} m={m} reload={reload} /></TabsContent>
                <TabsContent value="evidence"><EvidenceTab eng={eng} reload={reload} /></TabsContent>
                <TabsContent value="gates">
                  <Card>
                    <CardContent className="p-0 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b text-left text-muted-foreground">
                          <tr>{["", "Red line (§6)", "Status", "Basis", ""].map((h, i) => <th key={i} className="px-3 py-2 font-medium">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.entries(m.gates).map(([code, spec]) => (
                            <GateRow key={code} eng={eng} code={code} spec={spec} onSaved={reload} />
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="indicators" className="space-y-4">
                  <AiAssist eng={eng} onSaved={setEng} />
                  <p className="text-sm text-muted-foreground">
                    Score each indicator against the written anchors in Methodology Appendix C. E4 evidence always scores level 4.
                    A mitigation may lower a level by at most 2, and only if its evidence is E1–E2 and it is enforceable.
                  </p>
                  {Object.entries(m.domains).map(([d, spec]) => (
                    <Card key={d}>
                      <CardHeader className="pb-0">
                        <CardTitle className="text-base">{d} {spec.name} <span className="text-muted-foreground font-normal">· {Math.round(spec.weight * 100)}%</span></CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Object.entries(m.indicators).filter(([c]) => c.startsWith(d + ".")).map(([c, ind]) => (
                          <IndicatorRow key={c} eng={eng} code={c} name={ind.name} anchor={m.anchors?.[c]} onSaved={reload} />
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
              <div className="lg:sticky lg:top-6 self-start space-y-4"><RatingPanel eng={eng} m={m} /><Readiness checks={eng.readiness} /></div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
