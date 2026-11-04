"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient, clearAccessToken } from "@/lib/auth-client";
import { ShieldCheck } from "lucide-react";

/**
 * Evaluators see confidential company documents, so the portal requires a second factor:
 * a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).
 */
export default function TwoFactorSetupPage() {
  const [step, setStep] = useState<"password" | "scan" | "codes">("password");
  const [password, setPassword] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [backup, setBackup] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data) window.location.assign("/evaluator-login");
      else setEmail(data.user.email);
    });
  }, []);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { data, error: err } = await authClient.twoFactor.enable({ password, issuer: "TBRAC", method: "totp" });
    setBusy(false);
    if (err || !data || data.method !== "totp") { setError(err?.message || "Could not start setup. Check your password."); return; }
    setBackup(data.backupCodes);
    setSecret(new URL(data.totpURI).searchParams.get("secret") ?? "");
    setQr(await QRCode.toDataURL(data.totpURI, { margin: 1, width: 220 }));
    setPassword("");
    setStep("scan");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { error: err } = await authClient.twoFactor.verifyTotp({ code: code.replace(/\s/g, "") });
    setBusy(false);
    if (err) { setError(err.message || "That code didn't work. Enter the current code shown in the app."); return; }
    clearAccessToken(); // the next API token carries the second-factor claim
    setStep("codes");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header minimal />
      <div className="container mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><ShieldCheck className="h-6 w-6 text-primary" /></div>
            <CardTitle>Set up two-factor sign-in</CardTitle>
            <CardDescription>
              The evaluator portal holds confidential company documents. Each sign-in needs your password and a code from an authenticator app on your phone.
              {email && <> Signed in as <b>{email}</b>.</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

            {step === "password" && (
              <form onSubmit={start} className="space-y-3">
                <p>Install an authenticator app if you don&apos;t have one (Google Authenticator, Microsoft Authenticator or 1Password), then confirm your password.</p>
                <div className="space-y-1"><Label htmlFor="pw">Password</Label><PasswordInput id="pw" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button type="submit" disabled={busy || !password}>{busy ? "Starting…" : "Continue"}</Button>
              </form>
            )}

            {step === "scan" && (
              <form onSubmit={verify} className="space-y-3">
                <p>Scan this code with the app, then enter the 6-digit code it shows.</p>
                {qr && <img src={qr} alt="Authenticator setup QR code" className="mx-auto h-[220px] w-[220px] rounded border" />}
                <p className="text-xs text-muted-foreground">Can&apos;t scan? Enter this key in the app: <span className="break-all font-mono">{secret}</span></p>
                <div className="space-y-1"><Label htmlFor="code">6-digit code</Label>
                  <Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required /></div>
                <Button type="submit" disabled={busy || code.replace(/\s/g, "").length < 6}>{busy ? "Checking…" : "Turn on two-factor sign-in"}</Button>
              </form>
            )}

            {step === "codes" && (
              <div className="space-y-3">
                <p className="font-medium text-green-700">Two-factor sign-in is on.</p>
                <p>Save these backup codes somewhere safe (a password manager is best). Each works once if you lose your phone. They won&apos;t be shown again.</p>
                <div className="grid grid-cols-2 gap-1 rounded-md border bg-muted/40 p-3 font-mono text-xs">{backup.map((c) => <span key={c}>{c}</span>)}</div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I&apos;ve saved my backup codes</label>
                <Button disabled={!saved} onClick={() => window.location.assign("/evaluator/engagements")}>Go to the evaluator portal</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
