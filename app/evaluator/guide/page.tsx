"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";

// The engagement workflow as it runs in the workspace, tab by tab (Methodology §4).
const STAGES: { n: string; title: string; tab: string; who: string; steps: string[]; ai?: string[]; gate?: string }[] = [
  {
    n: "0", title: "Open and accept the engagement", tab: "Requests panel · Acceptance", who: "Lead analyst",
    steps: [
      "Open the engagement from the company's request (Requests panel on the engagements list), or with “New engagement”.",
      "On Acceptance: record the signed engagement letter, the flat fee and its status (escrowed or paid before the committee), and whether the letter includes consent to AI processing.",
      "Everyone who will work on or decide the engagement files an independence declaration on Acceptance. Anyone who can't affirm every statement must disclose why, and doesn't take part.",
      "Name the Relying Parties on Overview. On the company-engaged track, record each reliance letter as it is countersigned.",
    ],
    gate: "Committee approval needs the letter, a settled fee and the lead's declaration.",
  },
  {
    n: "1", title: "Scope and entity map", tab: "Overview · Entity map", who: "Lead analyst",
    steps: [
      "Describe the project and set any overlay weights on Overview.",
      "Build the entity map to natural persons and state bodies: every owner, parent and affiliate, with percentages, jurisdictions and registry IDs.",
    ],
    ai: ["Documents → AI reading lists owners and percentages found in company documents. Add them to the entity map only after checking the quote against the document."],
  },
  {
    n: "2", title: "Document requests", tab: "Document requests · Documents", who: "Lead analyst",
    steps: [
      "Issue the Appendix A items the project needs (and the management representation letter, needed before issue), then “Email the company”.",
      "Accept each production (it becomes evidence linked to its indicators), return it with a note, or waive it. An accepted refusal is a finding: grade it E4.",
      "On Documents: Extract text (PDF, Word) or OCR scan (images, scanned PDFs), then AI reading for an English summary, key facts, owners and possible red flags.",
    ],
    ai: ["Every AI item carries a verbatim quote that TBRAC checks against the document; “quote not found” means don't rely on it.", "Garbled Chinese PDFs are detected and blocked: use OCR scan or ask for the Word version."],
  },
  {
    n: "3", title: "Screening", tab: "Entity map → Screening", who: "Analyst",
    steps: [
      "Screen all entities against the US lists (Consolidated Screening List, 1260H, UFLPA, FCC). Each run is saved as evidence with the list versions used.",
      "Confirm or dismiss every hit, and record the red line yourself on Red lines.",
    ],
    ai: ["“Explain (AI)” on a hit compares names, IDs and jurisdictions and says what document would settle it. It never records a red line."],
  },
  {
    n: "4", title: "Verification and scoring", tab: "Evidence · Red lines · Indicators", who: "Analyst",
    steps: [
      "Record independent evidence (registries, public records, technical tests). Evidence the company didn't author ranks higher.",
      "Check every red line (Red lines tab) with its basis.",
      "Score all 29 indicators against the written anchors (Scoring guide on each row), with a rationale. Write the rationale as facts: it is what the company sees for right of reply.",
      "An evidence grade can't exceed what the evidence register supports; each row shows the most its evidence allows.",
    ],
    ai: ["Indicators → “Run blind scoring review”: the AI reads only the anchors and evidence, never your scores, and suggests a level per indicator. Differences of 2+ levels go to the committee; address them in your rationale.",
      "“Check scorecard consistency” lists contradictions (e.g. a golden share described but S1 marked clear)."],
    gate: "Committee approval needs every grade backed by evidence.",
  },
  {
    n: "5", title: "Right of reply", tab: "Right of reply", who: "Lead analyst",
    steps: [
      "Share the draft factual findings (never levels, grades, red lines or the rating). The company has 14 days by default.",
      "Review the response and correct findings where the evidence supports it. If you change findings, consider sharing again.",
    ],
    ai: ["“Map reply to findings (AI)” lists each correction and the finding it concerns, with checked quotes, so none is missed."],
    gate: "Committee approval needs the reply given (a response received, or the deadline passed).",
  },
  {
    n: "6", title: "Second review, report inputs, committee", tab: "Committee · Report inputs", who: "Second reviewer · Committee",
    steps: [
      "A second reviewer (not the lead) signs off on the evidence and scoring. Any later rating change makes the sign-off stale.",
      "Report inputs: Outlook, statutory eligibility findings per jurisdiction, recommended agreement conditions.",
      "The committee chair (not the lead, not the second reviewer) records the decision with at least 3 members, including any independent external members, with the rationale and any dissent.",
    ],
    ai: ["“Draft conditions with AI” suggests conditions from the findings, worded as objective facts. Add the ones you want, then edit."],
    gate: "The readiness panel (right of the workspace) lists anything still missing.",
  },
  {
    n: "7", title: "Issue", tab: "Overview → Stage: Issued", who: "Committee chair",
    steps: [
      "Re-screen within 7 days of issue, accept the management representation letter, and record counsel's review for any T3/T4 rating.",
      "Issue. The report gets a number and a fingerprint; Relying Parties can check its live status at tbrac.org/verify.",
      "Open the report (Report → restricted or public view, English or Chinese) and print or save as PDF.",
    ],
  },
  {
    n: "8", title: "Monitoring", tab: "Monitoring · engagements list", who: "Surveillance analyst",
    steps: [
      "Issued ratings are re-screened every morning. A new exact match puts the rating Under Review automatically; possible matches raise alerts.",
      "Run a bring-down re-screen at each Relying Party decision point. Resolve Under Review within 90 days: affirm, reopen for re-rating, withdraw or expire.",
      "Acknowledge alerts on the engagements list once handled.",
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-10">
        <Link href="/evaluator/engagements" className="text-sm text-primary hover:underline">← Comprehensive assessments</Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Running an engagement</h1>
          <p className="text-muted-foreground">The workspace follows Methodology §4. This page says what to do on each tab, what the readiness panel will ask for, and where AI can save time.</p>
        </div>
        <Card>
          <CardContent className="pt-6 text-sm space-y-1">
            <p className="font-medium">Ground rules</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>People decide. AI suggestions never change a score, grade, red line or the rating, and are never cited as evidence.</li>
              <li>Every change is in the audit trail with who made it. A change after a sign-off or committee approval makes it stale.</li>
              <li>Lawful methods only: no pretext calls, purchased non-public data or mainland proxies (§5.4).</li>
              <li>Analysts never discuss fees with the company.</li>
            </ul>
          </CardContent>
        </Card>
        {STAGES.map((s) => (
          <Card key={s.n}>
            <CardContent className="pt-6 space-y-2 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-muted-foreground">{s.n}</span>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <span className="text-xs text-muted-foreground">{s.tab} · {s.who}</span>
              </div>
              <ol className="list-decimal space-y-1 pl-5">{s.steps.map((x) => <li key={x}>{x}</li>)}</ol>
              {s.ai && (
                <div className="rounded-md bg-sky-50 p-2 text-sky-900">
                  <p className="text-xs font-semibold uppercase tracking-wide">Where AI helps</p>
                  <ul className="list-disc pl-5">{s.ai.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
              )}
              {s.gate && <p className="text-xs text-amber-800">{s.gate}</p>}
            </CardContent>
          </Card>
        ))}
        <p className="text-sm text-muted-foreground">If an AI button returns an error, run the <Link href="/evaluator/ai" className="text-primary hover:underline">AI self-test</Link>.</p>
      </main>
    </div>
  );
}
