"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { Copyright } from "@/components/copyright";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient, clearAccessToken } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { title: "Sign-in security", lead: "Your account holds sensitive company documents. Two-factor sign-in adds a code from an authenticator app to your password. We strongly recommend it.",
        on: "Two-factor sign-in is on.", off: "Two-factor sign-in is off.", password: "Confirm your password", start: "Turn on two-factor sign-in", disable: "Turn it off", busy: "Please wait…",
        scan: "Scan this code with an authenticator app (Google Authenticator, Microsoft Authenticator or 1Password), then enter the 6-digit code it shows.", key: "Can't scan? Enter this key:", code: "6-digit code", confirm: "Confirm",
        codes: "Save these backup codes somewhere safe. Each works once if you lose your phone, and they won't be shown again.", saved: "I've saved them", wrongPw: "That didn't work. Check your password.", wrongCode: "That code didn't work. Enter the current code from the app." },
  zh: { title: "登录安全", lead: "您的账户保存着敏感的企业文件。双重身份验证在密码之外增加身份验证器应用的验证码，我们强烈建议开启。",
        on: "双重身份验证已开启。", off: "双重身份验证未开启。", password: "确认您的密码", start: "开启双重身份验证", disable: "关闭", busy: "请稍候…",
        scan: "请使用身份验证器应用（Google Authenticator、Microsoft Authenticator 或 1Password）扫描此二维码，然后输入显示的 6 位验证码。", key: "无法扫描？请输入此密钥：", code: "6 位验证码", confirm: "确认",
        codes: "请妥善保存这些备用验证码。手机丢失时每个验证码可使用一次，且不会再次显示。", saved: "我已保存", wrongPw: "操作失败，请检查密码。", wrongCode: "验证码无效，请输入应用中当前显示的验证码。" },
};

function Content() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [step, setStep] = useState<"idle" | "scan" | "codes">("idle");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [backup, setBackup] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const enabled = Boolean((user as { twoFactorEnabled?: boolean } | null)?.twoFactorEnabled);
  const start = async () => {
    setBusy(true); setError("");
    const { data, error: err } = await authClient.twoFactor.enable({ password, issuer: "TBRAC", method: "totp" });
    setBusy(false);
    if (err || !data || data.method !== "totp") { setError(t.wrongPw); return; }
    setBackup(data.backupCodes); setSecret(new URL(data.totpURI).searchParams.get("secret") ?? "");
    setQr(await QRCode.toDataURL(data.totpURI, { margin: 1, width: 220 })); setPassword(""); setStep("scan");
  };
  const verify = async () => {
    setBusy(true); setError("");
    const { error: err } = await authClient.twoFactor.verifyTotp({ code: code.replace(/\s/g, "") });
    setBusy(false);
    if (err) { setError(t.wrongCode); return; }
    clearAccessToken(); setStep("codes");
  };
  const disable = async () => {
    setBusy(true); setError("");
    const { error: err } = await authClient.twoFactor.disable({ password });
    setBusy(false);
    if (err) { setError(t.wrongPw); return; }
    clearAccessToken(); window.location.reload();
  };
  return (
    <main id="main" className="mx-auto max-w-xl space-y-4 px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t.title}</h1>
      <p className="text-[15px] leading-relaxed text-slate-600">{t.lead}</p>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 text-sm">
        {step === "idle" && (
          <>
            <p className={`font-medium ${enabled ? "text-emerald-700" : "text-slate-900"}`}>{enabled ? t.on : t.off}</p>
            <label className="block"><span className="text-slate-600">{t.password}</span><PasswordInput className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            {enabled ? <Button variant="outline" disabled={busy || !password} onClick={disable}>{busy ? t.busy : t.disable}</Button>
              : <Button disabled={busy || !password} onClick={start}>{busy ? t.busy : t.start}</Button>}
          </>
        )}
        {step === "scan" && (
          <>
            <p>{t.scan}</p>
            {qr && <img src={qr} alt="QR code" className="mx-auto h-[220px] w-[220px] rounded border" />}
            <p className="text-xs text-slate-500">{t.key} <span className="break-all font-mono">{secret}</span></p>
            <label className="block"><span className="text-slate-600">{t.code}</span><Input className="mt-1" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} /></label>
            <Button disabled={busy || code.replace(/\s/g, "").length < 6} onClick={verify}>{busy ? t.busy : t.confirm}</Button>
          </>
        )}
        {step === "codes" && (
          <>
            <p className="font-medium text-emerald-700">{t.on}</p>
            <p>{t.codes}</p>
            <div className="grid grid-cols-2 gap-1 rounded-md border bg-slate-50 p-3 font-mono text-xs">{backup.map((c) => <span key={c}>{c}</span>)}</div>
            <Button onClick={() => window.location.assign("/company/profile")}>{t.saved}</Button>
          </>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </main>
  );
}

export default function CompanySecurityPage() {
  return <ProtectedRoute><div className="min-h-screen bg-slate-50"><PortalHeader /><Content /><Copyright /></div></ProtectedRoute>;
}
