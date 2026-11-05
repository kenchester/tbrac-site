"use client"

import { MarketingShell, serif } from "@/components/marketing-shell"

export type LegalBlock = { h: string; p?: string[]; list?: string[]; table?: { head: string[]; rows: string[][] } }

/** Layout for the privacy policy and terms: dated, numbered-free sections with paragraphs, lists and tables. */
export function LegalPage({ title, lead, updated, blocks }: { title: string; lead: string; updated: string; blocks: LegalBlock[] }) {
  return (
    <MarketingShell title={title} lead={lead}>
      <div className="space-y-10">
        <p className="text-sm text-slate-500">{updated}</p>
        {blocks.map((b) => (
          <section key={b.h} className="space-y-3">
            <h2 className={`${serif.className} text-2xl font-semibold tracking-tight`}>{b.h}</h2>
            {b.p?.map((x) => <p key={x} className="text-[15px] leading-relaxed text-slate-700">{x}</p>)}
            {b.list && <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-slate-700">{b.list.map((x) => <li key={x}>{x}</li>)}</ul>}
            {b.table && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b-2 border-slate-900"><tr>{b.table.head.map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-200">
                    {b.table.rows.map((r) => <tr key={r[0]} className="align-top">{r.map((x, i) => <td key={i} className={`py-2 pr-4 ${i ? "text-slate-600" : "font-medium"}`}>{x}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </MarketingShell>
  )
}
