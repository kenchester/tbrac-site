"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, UserRoundCheck } from "lucide-react";
import { companyViewApi, type ViewContext } from "@/lib/company-view";

/** Shown on company pages when TBRAC staff are using them: on a dummy company, or assisting an actual client. */
export function CompanyViewBanner({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [ctx, setCtx] = useState<ViewContext | null>(null);
  useEffect(() => { companyViewApi.context(customerId).then(setCtx).catch(() => setCtx(null)); }, [customerId]);
  if (!ctx || ctx.mode === "owner") return null;

  if (ctx.mode === "sandbox") return (
    <div className="border-b border-sky-200 bg-sky-50 text-sky-950">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p className="flex items-center gap-2"><FlaskConical className="h-4 w-4 shrink-0" />
          <span><strong>Dummy data.</strong> {ctx.customer_name} is a test company. Nothing here is a real client or a real assessment.</span></p>
        <Link href="/evaluator/company-view" className="font-semibold underline-offset-2 hover:underline">Back to company view</Link>
      </div>
    </div>
  );

  const s = ctx.session;
  const end = async () => {
    if (s) await companyViewApi.endAssist(s.id).catch(() => {});
    router.push("/evaluator/company-view");
  };
  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-950">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p className="flex items-center gap-2"><UserRoundCheck className="h-4 w-4 shrink-0" />
          <span><strong>Assisting an actual client: {ctx.customer_name}.</strong> Every change is recorded and shown to the client.
            {s && <> Session ends {new Date(s.expires_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.</>}</span></p>
        <button type="button" onClick={end} className="rounded-md border border-amber-400 bg-white px-3 py-1 font-semibold hover:bg-amber-100">End session</button>
      </div>
    </div>
  );
}
