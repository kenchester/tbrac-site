"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { engagementsApi, type EngagementDetail, type Methodology, type Rating } from "@/lib/engagements";
import { REPORT_TEXT, DOMAIN_ZH, type ReportLang } from "@/lib/report-text";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid-page space-y-3">
      <h2 className="border-b border-slate-300 pb-1 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows, none }: { head: string[]; rows: (string | null | undefined)[][]; none: string }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-slate-800 text-left">{head.map((h) => <th key={h} className="py-1.5 pr-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={head.length} className="py-2 text-slate-500">{none}</td></tr>}
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
  const [lang, setLang] = useState<ReportLang>("en");
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("view") === "public") setView("public");
    if (q.get("lang") === "zh") setLang("zh");
    engagementsApi.get(id).then(setEng).catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
    engagementsApi.methodology().then(setM).catch(() => {});
  }, [id]);

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!eng || !m) return <p className="p-8 text-slate-500">Loading…</p>;

  const t = REPORT_TEXT[lang];
  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const issued = !!eng.rating_snapshot;
  const r: Rating = eng.rating_snapshot ?? eng.rating;
  const statusKey = ["under_review", "withdrawn", "expired"].includes(eng.stage) ? eng.stage : issued ? "current" : "draft";
  const ind = (c: string) => m.indicators[c]?.name ?? c;
  const domainName = (d: string) => (lang === "zh" ? DOMAIN_ZH[d] : m.domains[d]?.name) ?? "";
  const mitigations = eng.indicator_scores.filter((s) => s.residual_level != null && s.residual_level < s.inherent_level);
  const entityName = Object.fromEntries(eng.entities.map((e) => [e.id, e.name]));
  const lvl = (n: number | null | undefined) => (n == null ? null : `${t.level} ${n}`);
  const domainRows = Object.entries(r.domain_tiers).map(([d, tier]) => [`${d} ${domainName(d)}`, tier]);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="print:hidden sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href={`/evaluator/engagements/${eng.id}`} className="text-sm text-primary hover:underline">{t.back}</Link>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant={view === "restricted" ? "default" : "outline"} onClick={() => setView("restricted")}>{t.restricted}</Button>
            <Button size="sm" variant={view === "public" ? "default" : "outline"} onClick={() => setView("public")}>{t.public}</Button>
            <Button size="sm" variant="outline" onClick={() => setLang(lang === "en" ? "zh" : "en")}>{lang === "en" ? "中文" : "English"}</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>{t.print}</Button>
          </div>
        </div>
      </div>

      <article className="mx-auto my-6 max-w-4xl space-y-8 bg-white p-10 text-slate-900 shadow print:my-0 print:max-w-none print:p-0 print:shadow-none">
        {!issued && <p className="rounded border-2 border-red-500 px-3 py-2 text-center text-sm font-semibold uppercase tracking-wide text-red-700">{t.draft}</p>}
        {eng.stage === "under_review" && (
          <p className="rounded border-2 border-amber-500 px-3 py-2 text-center text-sm font-semibold text-amber-800">{t.underReview(fmt(eng.review_started_at), fmt(eng.review_due_at))}</p>
        )}
        {(eng.stage === "withdrawn" || eng.stage === "expired") && (
          <p className="rounded border-2 border-red-500 px-3 py-2 text-center text-sm font-semibold uppercase text-red-700">{eng.stage === "withdrawn" ? t.withdrawn : t.expired}</p>
        )}
        {t.governs && <p className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">{t.governs}</p>}
        <header className="space-y-1 border-b-4 border-slate-900 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t.brand} · {view === "public" ? t.public : t.restricted}{eng.report_number ? ` · ${eng.report_number}` : ""}
          </p>
          <h1 className="text-3xl font-bold">{eng.customer_name}</h1>
          <p className="text-sm text-slate-600">
            {t.assessment[eng.engagement_type] ?? eng.engagement_type} · {t.methodology} {r.methodology_version} ·
            {" "}{t.asOf} {issued ? fmt(eng.issued_at) : fmt(new Date().toISOString())} · {t.validUntil} {fmt(eng.valid_until)}
          </p>
          {view === "restricted" && <p className="text-sm text-slate-600">{t.intended(eng.relying_parties.length ? eng.relying_parties.join("; ") : "—")}</p>}
        </header>

        <Section title={t.opinion}>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              [t.tier, r.tier ? t.tiers[r.tier] ?? r.tier : t.incomplete],
              [t.confidence, r.confidence ? t.conf[r.confidence] ?? r.confidence : "—"],
              [t.outlook, eng.outlook ? t.outlooks[eng.outlook] : "—"],
              [t.status, t.statuses[statusKey]],
            ].map(([k, v]) => (
              <div key={k} className="rounded border border-slate-300 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{k}</p>
                <p className="mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>
          {eng.project_description && <p className="text-sm"><span className="font-semibold">{t.scope}:</span> {eng.project_description}</p>}
          <ul className="list-disc space-y-1 pl-5 text-sm">{t.statements.map((s) => <li key={s}>{s}</li>)}</ul>
        </Section>

        <Section title={t.domains}>
          <Table none={t.none} head={t.domainHead} rows={domainRows} />
        </Section>

        {view === "restricted" && (
          <>
            <Section title={t.bridge}>
              <p className="text-sm">{t.bridgeLine(r.inherent_tier ?? "—", r.tier ?? "—")}</p>
              <Table none={t.none} head={t.bridgeHead}
                rows={mitigations.map((s) => [`${s.code} ${ind(s.code)}`, lvl(s.inherent_level), lvl(s.residual_level), s.mitigation, s.mitigation_grade ? t.grades[s.mitigation_grade] : null])} />
              {r.reasons.length > 0 && (
                <div className="text-sm"><p className="font-semibold">{t.rules}</p><ul className="list-disc pl-5">{r.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              )}
            </Section>

            <Section title={t.statutory}>
              <p className="text-sm text-slate-600">{t.statutoryNote}</p>
              <Table none={t.none} head={t.statutoryHead} rows={eng.statutory_findings.map((f) => [f.jurisdiction, f.test, t.results[f.result], f.basis])} />
            </Section>

            <Section title={t.gates}>
              <Table none={t.none} head={t.gatesHead}
                rows={Object.entries(m.gates).map(([code, g]) => {
                  const res = eng.gate_results.find((x) => x.code === code);
                  return [code, g.name, res ? (res.status === "clear" ? t.clear : res.status === "triggered" ? t.triggered : t.notChecked) : t.notChecked, res?.basis, res ? fmt(res.checked_at) : null];
                })} />
            </Section>

            <Section title={t.findings}>
              <Table none={t.none} head={t.findingsHead}
                rows={Object.keys(m.indicators).map((c) => {
                  const s = eng.indicator_scores.find((x) => x.code === c);
                  return [`${c} ${ind(c)}`, s ? lvl(s.residual_level ?? s.inherent_level) : t.notScored, s ? t.grades[s.evidence_grade] : null, s?.rationale];
                })} />
            </Section>

            <Section title={t.entities}>
              <Table none={t.none} head={t.entitiesHead}
                rows={eng.entities.map((e) => [e.name + (e.name_zh ? ` (${e.name_zh})` : ""), t.roles[e.role] ?? e.role, e.parent_id ? entityName[e.parent_id] : null,
                  e.ownership_pct != null ? String(e.ownership_pct) : null, e.jurisdiction, e.registry_id, e.is_state_linked ? t.yes : t.no])} />
            </Section>

            <Section title={t.evidence}>
              <Table none={t.none} head={t.evidenceHead}
                rows={eng.evidence.map((e) => [e.description + (e.source_ref ? ` — ${e.source_ref}` : ""), t.sources[e.source_type] ?? e.source_type, e.authored_by_subject ? t.yes : t.no,
                  [...e.indicator_codes, ...e.gate_codes].join(" ") || null])} />
            </Section>

            <Section title={t.conditions}>
              {eng.conditions.length ? <ol className="list-decimal space-y-1 pl-5 text-sm">{eng.conditions.map((c, i) => <li key={i}>{c}</li>)}</ol>
                : <p className="text-sm text-slate-500">{t.none}</p>}
            </Section>

            <Section title={t.committee}>
              {(() => {
                const d = [...eng.committee_decisions].reverse().find((x) => x.decision === "approve");
                if (!d) return <p className="text-sm text-slate-500">{t.noCommittee}</p>;
                const sec = [...eng.signoffs].reverse().find((x) => x.kind === "second_review");
                const cr = [...eng.signoffs].reverse().find((x) => x.kind === "counsel_review");
                const ext = d.external_members?.length ?? 0;
                return (
                  <div className="space-y-1 text-sm">
                    <p>{t.approved(fmt(d.decided_at), d.members.length + ext, d.chair, ext)}</p>
                    <p><span className="font-semibold">{t.rationale}:</span> {d.rationale}</p>
                    {d.dissent && <p><span className="font-semibold">{t.dissent}:</span> {d.dissent}</p>}
                    {sec && <p>{t.secondReview(sec.signed_by, fmt(sec.signed_at))}</p>}
                    {cr && <p>{t.counselReview(cr.counsel_name ?? "", fmt(cr.signed_at))}</p>}
                    <p>{t.declarations(eng.declarations.filter((x) => x.cleared).length)}</p>
                  </div>
                );
              })()}
            </Section>

            <Section title={t.reply}>
              {eng.reply_shared_at && (
                <p className="text-sm text-slate-600">{t.replyShared(fmt(eng.reply_shared_at), fmt(eng.reply_due_at))}
                  {eng.reply_received_at ? t.replyReceived(fmt(eng.reply_received_at)) : t.replyNone}</p>
              )}
              <p className="whitespace-pre-wrap text-sm">{eng.subject_reply || t.noReply}</p>
            </Section>

            <Section title={t.caveats}>
              <ul className="list-disc space-y-1 pl-5 text-sm">{t.caveatList.map((c) => <li key={c}>{c}</li>)}</ul>
            </Section>
          </>
        )}

        {eng.report_number && (
          <section className="break-inside-avoid-page rounded border border-slate-300 p-4 text-sm">
            <p className="font-semibold">{t.report} {eng.report_number}</p>
            <p className="mt-1 text-slate-600">{t.verifyAt(eng.report_number)}</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-500">{t.fingerprint}: {eng.report_fingerprint}</p>
          </section>
        )}
        <footer className="border-t pt-3 text-xs text-slate-500">
          {t.footer(r.methodology_version)}
          {view === "public" && t.footerPublic}
        </footer>
      </article>
    </div>
  );
}
