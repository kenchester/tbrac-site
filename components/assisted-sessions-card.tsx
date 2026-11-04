"use client";

import { useEffect, useState } from "react";
import { UserRoundCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { companyViewApi, type AssistedSession } from "@/lib/company-view";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: {
    title: "TBRAC staff assistance",
    desc: "Each time TBRAC staff worked on your pages for you. Contact us if you did not ask for a session listed here.",
    changes: (n: number) => `${n} change${n === 1 ? "" : "s"}`, open: "In progress", locale: "en-US",
  },
  zh: {
    title: "TBRAC 工作人员协助记录",
    desc: "TBRAC 工作人员每次代您操作页面的记录。如有您未请求的协助记录，请联系我们。",
    changes: (n: number) => `${n} 项更改`, open: "进行中", locale: "zh-CN",
  },
};

/** Shown on the company dashboard when staff have assisted the company (transparency for the client). */
export function AssistedSessionsCard({ customerId }: { customerId: string }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [rows, setRows] = useState<AssistedSession[]>([]);
  useEffect(() => { companyViewApi.companySessions(customerId).then(setRows).catch(() => setRows([])); }, [customerId]);
  if (rows.length === 0) return null;
  const fmt = (d: string) => new Date(d).toLocaleString(t.locale, { dateStyle: "medium", timeStyle: "short" });
  const live = (s: AssistedSession) => !s.ended_at && new Date(s.expires_at) > new Date();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><UserRoundCheck className="h-4 w-4" />{t.title}</CardTitle>
        <CardDescription>{t.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y text-sm">
          {rows.map((s) => (
            <li key={s.id} className="py-2">
              <p className="font-medium">{fmt(s.started_at)} · {s.staff_email} · {live(s) ? t.open : t.changes(s.actions)}</p>
              <p className="text-muted-foreground">{s.reason}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
