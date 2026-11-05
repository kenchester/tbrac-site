"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { title: "Confirm your email address", text: (e: string) => `We sent a link to ${e}. You need to confirm it before requesting an assessment, signing or paying.`, send: "Send a new link", sent: "Sent. Check your inbox and spam folder." },
  zh: { title: "请确认您的电子邮箱", text: (e: string) => `我们已向 ${e} 发送链接。申请评估、签署或付款前，您需要先完成确认。`, send: "重新发送链接", sent: "已发送，请查看收件箱和垃圾邮件文件夹。" },
};

export function VerifyEmailBanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [sent, setSent] = useState(false);
  if (!user || user.emailVerified) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3"><MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-900" />
        <div><p className="font-semibold text-amber-950">{t.title}</p><p className="text-sm text-amber-900">{sent ? t.sent : t.text(user.email)}</p></div></div>
      {!sent && <Button size="sm" variant="outline" onClick={async () => { await authClient.sendVerificationEmail({ email: user.email, callbackURL: window.location.pathname }); setSent(true); }}>{t.send}</Button>}
    </div>
  );
}
