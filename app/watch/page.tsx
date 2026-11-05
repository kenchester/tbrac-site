"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Copyright } from "@/components/copyright";

/** Ask for a fresh link to your watchlist. The reply is the same whether or not the address is known. */
export default function WatchLinkPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl space-y-4 px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Status alerts</h1>
        <p className="text-slate-600">Follow any TBRAC report from its verify page with “Get status alerts”. To manage the reports you follow, enter your email and we&apos;ll send you a private link.</p>
        {done ? <p className="text-emerald-700">If that address has alerts, a link is on its way.</p> : (
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await fetch("/api/watch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); setDone(true); }}>
            <input type="email" required aria-label="Email" placeholder="Work email" className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="h-10 rounded-md bg-[#0b1f3a] px-4 text-sm font-semibold text-white">Send link</button>
          </form>
        )}
      </main>
      <Copyright />
    </div>
  );
}
