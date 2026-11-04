"use client";

import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import { ArrowRight, Check, Minus, Scale, FileSearch, Users, MessageSquareText, ShieldCheck, BookOpen } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { HOME } from "@/lib/home-content";
import { useLanguage } from "@/lib/language-context";

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"] });
const NAVY = "#0b1f3a";
const SIGNUP = "/company/login?tab=signup";
const TRUST_ICONS = [Scale, FileSearch, Users, MessageSquareText, ShieldCheck, BookOpen];
const TIER_STYLE: Record<string, string> = {
  T1: "bg-emerald-50 text-emerald-800 border-emerald-200",
  T2: "bg-sky-50 text-sky-800 border-sky-200",
  T3: "bg-amber-50 text-amber-800 border-amber-200",
  T4: "bg-rose-50 text-rose-800 border-rose-200",
  UA: "bg-slate-100 text-slate-700 border-slate-200",
};

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="TBRAC home">
      <span className="flex h-9 w-9 items-center justify-center rounded-sm text-sm font-bold tracking-tight text-white" style={{ background: NAVY }}>TB</span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-[0.18em] text-slate-900">TBRAC</span>
        <span className="block text-[11px] text-slate-500">Trans-Border Risk Assessment and Certification</span>
      </span>
    </Link>
  );
}

function SectionTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className={`${serif.className} text-3xl font-semibold tracking-tight text-slate-900 sm:text-[34px]`}>{title}</h2>
      {lead && <p className="mt-3 text-base leading-relaxed text-slate-600">{lead}</p>}
    </div>
  );
}

export default function HomePage() {
  const { language } = useLanguage();
  const c = HOME[language] ?? HOME.en;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav className="hidden items-center gap-7 text-sm text-slate-700 lg:flex">
            <a href="#how" className="hover:text-slate-950">{c.nav.how}</a>
            <Link href="/relying-parties" className="hover:text-slate-950">{c.nav.relying}</Link>
            <Link href="/methodology" className="hover:text-slate-950">{c.nav.methodology}</Link>
            <Link href="/case-studies" className="hover:text-slate-950">{c.nav.cases}</Link>
            <Link href="/faq" className="hover:text-slate-950">{c.nav.faq}</Link>
            <Link href="/about" className="hover:text-slate-950">{c.nav.about}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link href="/company/login" className="hidden px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 sm:block">{c.nav.signIn}</Link>
            <Link href={SIGNUP} className="rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.step1.cta}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: NAVY }} className="text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <h1 className={`${serif.className} text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl`}>{c.title}</h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-300">{c.lead}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={SIGNUP} className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                {c.ctaFree} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#steps" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                {c.ctaFull}
              </a>
            </div>
            <p className="mt-5 max-w-xl border-l-2 border-sky-300/50 pl-4 text-sm leading-relaxed text-slate-300">{c.ctaNote}</p>
          </div>

          {/* Illustrative opinion page */}
          <div className="self-center">
            <div className="rounded-md bg-white p-6 text-slate-900 shadow-2xl ring-1 ring-black/5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{c.sampleLabel}</p>
              <div className="mt-3 border-b-2 border-slate-900 pb-3">
                <p className={`${serif.className} text-xl font-semibold`}>{c.sample.company}</p>
                <p className="text-xs text-slate-500">{c.sample.type} · {c.sample.valid}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {(language === "zh" ? [["评级", c.sample.tier], ["可信度", c.sample.confidence], ["展望", c.sample.outlook], ["状态", c.sample.status]]
                  : [["Tier", c.sample.tier], ["Confidence", c.sample.confidence], ["Outlook", c.sample.outlook], ["Status", c.sample.status]]).map(([k, v]) => (
                  <div key={k} className="rounded border border-slate-200 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{k}</p>
                    <p className="mt-0.5 font-semibold">{v}</p>
                  </div>
                ))}
              </div>
              <table className="mt-4 w-full text-xs">
                <tbody className="divide-y divide-slate-100">
                  {c.sample.rows.map(([d, t]) => (
                    <tr key={d}>
                      <td className="py-1.5 text-slate-600">{d}</td>
                      <td className="py-1.5 text-right"><span className={`rounded border px-1.5 py-0.5 font-semibold ${TIER_STYLE[t]}`}>{t}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Two steps */}
      <section id="steps" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionTitle title={c.stepsTitle} lead={c.stepsLead} />
        <div className="relative mt-10 grid gap-6 lg:grid-cols-2">
          {[{ s: c.step1, href: SIGNUP, primary: false }, { s: c.step2, href: SIGNUP, primary: true }].map(({ s, href, primary }, i) => (
            <div key={s.name} className={`flex flex-col rounded-lg border p-8 ${primary ? "border-slate-900 shadow-lg" : "border-slate-200"}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${primary ? "text-sky-800" : "text-slate-500"}`}>{s.tag}</p>
              <h3 className={`${serif.className} mt-2 text-2xl font-semibold`}>{s.name}</h3>
              <p className="text-sm text-slate-500">{s.who}</p>
              <ul className="mt-6 flex-1 space-y-3 text-[15px] text-slate-700">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />{p}</li>
                ))}
              </ul>
              <p className="mt-6 flex gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600"><Minus className="mt-0.5 h-4 w-4 shrink-0" />{s.limit}</p>
              <Link href={href} className={`mt-6 inline-flex w-fit items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold ${primary ? "text-white" : "border border-slate-300 text-slate-900 hover:bg-slate-50"}`}
                style={primary ? { background: NAVY } : undefined}>
                {s.cta} <ArrowRight className="h-4 w-4" />
              </Link>
              {i === 0 && (
                <span aria-hidden className="absolute left-1/2 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow lg:flex">
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Who relies on it */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle title={c.relyTitle} />
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {c.rely.map((r) => (
              <div key={r.who} className="border-t-2 border-slate-900 pt-5">
                <h3 className="font-semibold text-slate-900">{r.who}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{r.what}</p>
              </div>
            ))}
          </div>
          <Link href="/relying-parties" className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline">{c.nav.relying} <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      {/* Process */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <SectionTitle title={c.processTitle} />
        <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {c.process.map((p) => (
            <li key={p.n} className="flex gap-4">
              <span className={`${serif.className} flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-base font-semibold text-slate-700`}>{p.n}</span>
              <div>
                <h3 className="font-semibold">{p.t}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{p.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Rating scale */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle title={c.scaleTitle} lead={c.scaleLead} />
          <div className="mt-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {c.scale.map((s) => (
              <div key={s.tier} className="grid grid-cols-[72px_1fr] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:grid-cols-[72px_220px_1fr]">
                <span className={`w-fit rounded border px-2.5 py-1 text-sm font-bold ${TIER_STYLE[s.tier]}`}>{s.tier}</span>
                <span className="font-semibold">{s.name}</span>
                <span className="col-span-2 text-[15px] text-slate-600 sm:col-span-1">{s.d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionTitle title={c.trustTitle} />
        <div className="mt-10 grid gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
          {c.trust.map((x, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <div key={x.t}>
                <Icon className="h-5 w-5 text-sky-800" strokeWidth={1.75} />
                <h3 className="mt-3 font-semibold">{x.t}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{x.d}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-14 rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{c.disclaimerTitle}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{c.disclaimer}</p>
          <Link href="/methodology" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline">{c.nav.methodology} <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      {/* Fees and verification */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
          <div>
            <h2 className={`${serif.className} text-2xl font-semibold`}>{c.fees.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{c.fees.text}</p>
            <ul className="mt-5 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-sm">
              {[c.fees.design, c.fees.operating, c.fees.monitoring].map((x) => (
                <li key={x} className="flex justify-between px-4 py-3"><span>{x}</span><span className="font-medium text-slate-700">{c.fees.flat}</span></li>
              ))}
            </ul>
            <Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline">{c.fees.ask} <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div>
            <h2 className={`${serif.className} text-2xl font-semibold`}>{c.verify.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{c.verify.text}</p>
            <Link href="/verify" className="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">{c.verify.cta} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: NAVY }} className="text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-16 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className={`${serif.className} text-3xl font-semibold`}>{c.finalTitle}</h2>
            <p className="mt-2 text-slate-300">{c.finalLead}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={SIGNUP} className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">{c.ctaFree} <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/company/login" className="rounded-md border border-white/30 px-5 py-3 text-sm font-semibold hover:bg-white/10">{c.nav.signIn}</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <Wordmark />
            <p className="mt-3 text-xs text-slate-500">© {new Date().getFullYear()} Assurance Pacific Assessments LLC. {c.footer.rights}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <Link href="/methodology" className="hover:text-slate-950">{c.nav.methodology}</Link>
            <Link href="/faq" className="hover:text-slate-950">{c.nav.faq}</Link>
            <Link href="/relying-parties" className="hover:text-slate-950">{c.nav.relying}</Link>
            <Link href="/verify" className="hover:text-slate-950">{c.verify.cta}</Link>
            <Link href="/contact" className="hover:text-slate-950">{c.footer.contact}</Link>
            <Link href="/privacy" className="hover:text-slate-950">{c.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-slate-950">{c.footer.terms}</Link>
            <Link href="/evaluator-login" className="text-slate-500 hover:text-slate-950">{c.footer.evaluator}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
