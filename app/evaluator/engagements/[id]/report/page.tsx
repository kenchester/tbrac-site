"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { engagementsApi, TIER_LABEL, type EngagementDetail, type Methodology, type Rating } from "@/lib/engagements";

// Required statements (Methodology §1.3) — every report, both views.
const STATEMENTS = [
  "This report is an independent risk opinion as of the date stated. It is not a certification, guarantee, warranty, surety, clearance or approval of any kind.",
  "It is not a CFIUS determination, export-control classification or decision of any government agency, and it carries no government endorsement.",
  "It does not override any statute. Where a law bars a transaction, no rating changes that result.",
  "It is not legal advice. Legal conclusions referenced here are those of the subject's counsel, collected and graded as evidence.",
];
// Data-availability caveats (Methodology §5.4)
const CAVEATS = [
  "PRC court-judgment publication has fallen sharply since 2019; the absence of PRC litigation records proves little.",
  "The PBOC/SAMR beneficial-owner register is not public; PRC registry data shows first-tier owners only and may be incomplete.",
  "Major PRC commercial databases restrict overseas access.",
  "Audited financial statements are not, by themselves, proof of revenue.",
];
const GRADE: Record<string, string> = { E1: "Verified", E2: "Cross-checked", E3: "Attested only", E4: "Unverifiable" };
const RESULT: Record<string, string> = { meets: "Meets definition", does_not_meet: "Does not meet definition", not_determined: "Not determined" };
const OUTLOOK: Record<string, string> = { stable: "Stable", positive: "Positive", negative: "Negative" };
const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid-page space-y-3">
      <h2 className="border-b border-slate-300 pb-1 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | null | undefined)[][] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-slate-800 text-left">{head.map((h) => <th key={h} className="py-1.5 pr-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={head.length} className="py-2 text-slate-500">None recorded.</td></tr>}
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-slate-200 align-top">{r.map((c, j) => <td key={j} className="py-1.5 pr-3">{c ?? "—"}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [eng, setEng] = useState<EngagementDetail | null>(null);
  const [m, setM] = useState<Methodology | null>(null);
  const [view, setView] = useState<"restricted" | "public">("restricted");
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "public") setView("public");
    engagementsApi.get(id).then(setEng).catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
    engagementsApi.methodology().then(setM).catch(() => {});
  }, [id]);

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!eng || !m) return <p className="p-8 text-slate-500">Loading…</p>;

  const issued = !!eng.rating_snapshot;
  const r: Rating = eng.rating_snapshot ?? eng.rating;
  const status = eng.stage === "under_review" ? "Under review" : eng.stage === "withdrawn" ? "Withdrawn" : eng.stage === "expired" ? "Expired" : issued ? "Current" : "Draft";
  const ind = (c: string) => m.indicators[c]?.name ?? c;
  const mitigations = eng.indicator_scores.filter((s) => s.residual_level != null && s.residual_level < s.inherent_level);
  const entityName = Object.fromEntries(eng.entities.map((e) => [e.id, e.name]));

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="print:hidden sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href={`/evaluator/engagements/${eng.id}`} className="text-sm text-primary hover:underline">← Back to workspace</Link>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant={view === "restricted" ? "default" : "outline"} onClick={() => setView("restricted")}>Restricted report</Button>
            <Button size="sm" variant={view === "public" ? "default" : "outline"} onClick={() => setView("public")}>Public summary</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>Print / save as PDF</Button>
          </div>
        </div>
      </div>

      <article className="mx-auto my-6 max-w-4xl space-y-8 bg-white p-10 text-slate-900 shadow print:my-0 print:max-w-none print:p-0 print:shadow-none">
        {!issued && (
          <p className="rounded border-2 border-red-500 px-3 py-2 text-center text-sm font-semibold uppercase tracking-wide text-red-700">
            Draft — not issued. Rating may change. Not for reliance.
          </p>
        )}
        <header className="space-y-1 border-b-4 border-slate-900 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            TBRAC Independent Risk Assessment · {view === "public" ? "Public summary" : "Restricted report"}
          </p>
          <h1 className="text-3xl font-bold">{eng.customer_name}</h1>
          <p className="text-sm text-slate-600">
            <span className="capitalize">{eng.engagement_type}</span> assessment · Methodology {r.methodology_version} ·
            As of {issued ? fmt(eng.issued_at) : fmt(new Date().toISOString())} · Valid until {fmt(eng.valid_until)}
          </p>
          {view === "restricted" && (
            <p className="text-sm text-slate-600">Intended users: {eng.relying_parties.length ? eng.relying_parties.join("; ") : "—"}. Not for distribution beyond the intended users.</p>
          )}
        </header>

        <Section title="Opinion">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Tier", r.tier ? TIER_LABEL[r.tier] ?? r.tier : "Incomplete"],
              ["Confidence", r.confidence ?? "—"],
              ["Outlook", eng.outlook ? OUTLOOK[eng.outlook] : "—"],
              ["Status", status],
            ].map(([k, v]) => (
              <div key={k} className="rounded border border-slate-300 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{k}</p>
                <p className="mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>
          {eng.project_description && <p className="text-sm"><span className="font-semibold">Scope:</span> {eng.project_description}</p>}
          <ul className="list-disc space-y-1 pl-5 text-sm">{STATEMENTS.map((s) => <li key={s}>{s}</li>)}</ul>
        </Section>

        {view === "restricted" && (
          <>
            <Section title="Inherent to residual risk">
              <p className="text-sm">Inherent tier <b>{r.inherent_tier ?? "—"}</b> → residual tier <b>{r.tier ?? "—"}</b>.</p>
              <Table head={["Indicator", "Inherent", "Residual", "Mitigation", "Mitigation evidence"]}
                rows={mitigations.map((s) => [`${s.code} ${ind(s.code)}`, `Level ${s.inherent_level}`, `Level ${s.residual_level}`, s.mitigation, s.mitigation_grade ? GRADE[s.mitigation_grade] : null])} />
              {r.reasons.length > 0 && (
                <div className="text-sm"><p className="font-semibold">Rules applied</p><ul className="list-disc pl-5">{r.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              )}
            </Section>

            <Section title="Domain ratings">
              <Table head={["Domain", "Tier"]} rows={Object.entries(r.domain_tiers).map(([d, t]) => [`${d} ${m.domains[d]?.name ?? ""}`, t])} />
            </Section>

            <Section title="Statutory eligibility">
              <p className="text-sm text-slate-600">Reported alongside, not combined with, the rating. A favorable tier never overrides a statutory bar.</p>
              <Table head={["Jurisdiction", "Test", "Result", "Basis"]} rows={eng.statutory_findings.map((f) => [f.jurisdiction, f.test, RESULT[f.result], f.basis])} />
            </Section>

            <Section title="Red-line results">
              <Table head={["Gate", "Test", "Result", "Basis", "Checked"]}
                rows={Object.entries(m.gates).map(([code, g]) => {
                  const res = eng.gate_results.find((x) => x.code === code);
                  return [code, g.name, res ? (res.status === "clear" ? "Clear" : res.status === "triggered" ? "TRIGGERED" : "Not checked") : "Not checked", res?.basis, res ? fmt(res.checked_at) : null];
                })} />
            </Section>

            <Section title="Findings by indicator">
              <Table head={["Indicator", "Level", "Evidence", "Basis"]}
                rows={Object.keys(m.indicators).map((c) => {
                  const s = eng.indicator_scores.find((x) => x.code === c);
                  return [`${c} ${ind(c)}`, s ? `Level ${s.residual_level ?? s.inherent_level}` : "Not scored", s ? GRADE[s.evidence_grade] : null, s?.rationale];
                })} />
            </Section>

            <Section title="Ownership and entities">
              <Table head={["Entity", "Role", "Held by", "%", "Jurisdiction", "Registry ID", "State-linked"]}
                rows={eng.entities.map((e) => [e.name + (e.name_zh ? ` (${e.name_zh})` : ""), e.role.replace("_", " "), e.parent_id ? entityName[e.parent_id] : null,
                  e.ownership_pct != null ? String(e.ownership_pct) : null, e.jurisdiction, e.registry_id, e.is_state_linked ? "Yes" : "No"])} />
            </Section>

            <Section title="Evidence register">
              <Table head={["Evidence", "Source", "Subject-authored", "Supports"]}
                rows={eng.evidence.map((e) => [e.description + (e.source_ref ? ` — ${e.source_ref}` : ""), e.source_type.replace("_", " "), e.authored_by_subject ? "Yes" : "No",
                  [...e.indicator_codes, ...e.gate_codes].join(" ") || null])} />
            </Section>

            <Section title="Recommended agreement conditions">
              {eng.conditions.length ? <ol className="list-decimal space-y-1 pl-5 text-sm">{eng.conditions.map((c, i) => <li key={i}>{c}</li>)}</ol>
                : <p className="text-sm text-slate-500">None recorded.</p>}
            </Section>

            <Section title="Rating committee">
              {(() => {
                const d = [...eng.committee_decisions].reverse().find((x) => x.decision === "approve");
                return d ? (
                  <div className="space-y-1 text-sm">
                    <p>Approved {fmt(d.decided_at)} by a committee of {d.members.length} (chair: {d.chair}). The lead analyst did not vote.</p>
                    <p><span className="font-semibold">Rationale:</span> {d.rationale}</p>
                    {d.dissent && <p><span className="font-semibold">Dissent recorded:</span> {d.dissent}</p>}
                  </div>
                ) : <p className="text-sm text-slate-500">No committee approval recorded.</p>;
              })()}
            </Section>

            <Section title="Subject's response">
              <p className="whitespace-pre-wrap text-sm">{eng.subject_reply || "No response recorded."}</p>
            </Section>

            <Section title="Data-availability caveats">
              <ul className="list-disc space-y-1 pl-5 text-sm">{CAVEATS.map((c) => <li key={c}>{c}</li>)}</ul>
            </Section>
          </>
        )}

        <footer className="border-t pt-3 text-xs text-slate-500">
          Prepared under TBRAC Assessment Methodology {r.methodology_version}. Point scores are internal working figures and are not reported.
          {view === "public" && " This public summary omits confidential findings; the restricted report is available only to the named intended users."}
        </footer>
      </article>
    </div>
  );
}
