"use client"

import Link from "next/link"
import { serif } from "@/lib/fonts"
import { SiteHeader } from "@/components/site-header"
import { Copyright } from "@/components/copyright"

export { serif }
export const NAVY = "#0b1f3a"
export const SIGNUP = "/company/login?tab=signup"


/** Header, hero and footer shared by the public explainer pages. */
export function MarketingShell({ title, lead, children, cta }: {
  title: string; lead: string; children: React.ReactNode; cta?: { href: string; label: string }
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <section style={{ background: NAVY }} className="text-white">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h1 className={`${serif.className} text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl`}>{title}</h1>
          <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-slate-300">{lead}</p>
        </div>
      </section>
      <main id="main" className="mx-auto max-w-5xl space-y-16 px-5 py-16">{children}</main>
      <Copyright />
    </div>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className={`${serif.className} text-3xl font-semibold tracking-tight`}>{children}</h2>
}
