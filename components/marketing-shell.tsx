"use client"

import Link from "next/link"
import { Source_Serif_4 } from "next/font/google"
import { LanguageToggle } from "@/components/language-toggle"
import { Copyright } from "@/components/copyright"
import { useLanguage } from "@/lib/language-context"

export const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"] })
export const NAVY = "#0b1f3a"
export const SIGNUP = "/company/login?tab=signup"

const NAV = {
  en: [["/for-companies", "For companies"], ["/for-government", "For US public bodies"], ["/methodology", "Methodology"], ["/verify", "Verify a report"]],
  zh: [["/for-companies", "企业指南"], ["/for-government", "美国公共机构"], ["/methodology", "评估方法"], ["/verify", "核验报告"]],
}

/** Header, hero and footer shared by the public explainer pages. */
export function MarketingShell({ title, lead, children, cta }: {
  title: string; lead: string; children: React.ReactNode; cta?: { href: string; label: string }
}) {
  const { language } = useLanguage()
  const nav = NAV[language] ?? NAV.en
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="TBRAC home">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm text-sm font-bold text-white" style={{ background: NAVY }}>TB</span>
            <span className="text-[15px] font-bold tracking-[0.18em]">TBRAC</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex">
            {nav.map(([href, label]) => <Link key={href} href={href} className="hover:text-slate-950">{label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {cta && <Link href={cta.href} className="hidden rounded-md px-4 py-2 text-sm font-semibold text-white sm:block" style={{ background: NAVY }}>{cta.label}</Link>}
          </div>
        </div>
      </header>
      <section style={{ background: NAVY }} className="text-white">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h1 className={`${serif.className} text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl`}>{title}</h1>
          <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-slate-300">{lead}</p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl space-y-16 px-5 py-16">{children}</main>
      <Copyright />
    </div>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className={`${serif.className} text-3xl font-semibold tracking-tight`}>{children}</h2>
}
