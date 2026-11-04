"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { engagementsApi } from "@/lib/engagements";

type Result = Awaited<ReturnType<typeof engagementsApi.aiSelfTest>>;

export default function AiCheckPage() {
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async () => {
    setBusy(true); setError("");
    try { setRes(await engagementsApi.aiSelfTest()); } catch (e) { setError(e instanceof Error ? e.message : "Self-test failed"); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header minimal />
      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-10">
        <Link href="/evaluator/engagements" className="text-sm text-primary hover:underline">← Comprehensive assessments</Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI self-test</h1>
          <p className="text-muted-foreground">Runs each AI assistance feature once on built-in fictional data. No company data is sent, so no consent is needed.
            Use it after changing the AI provider or model, or if an AI button returns an error.</p>
        </div>
        <Button onClick={run} disabled={busy}>{busy ? "Running 7 checks… (up to a minute)" : "Run self-test"}</Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {res && !res.configured && <p className="text-sm text-red-600">AI is not configured on the API (AI_API_KEY).</p>}
        {res?.configured && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{res.passed}/{res.total} passed · {res.model} · vision {res.vision_model}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {res.results.map((r) => (
                <div key={r.feature} className="flex gap-3 border-b pb-2 last:border-b-0">
                  <Badge variant="outline" className={r.ok ? "border-green-400 text-green-700" : "border-red-400 text-red-700"}>{r.ok ? "Pass" : "Fail"}</Badge>
                  <div>
                    <p className="font-medium">{r.feature} <span className="text-xs font-normal text-muted-foreground">{r.seconds}s</span></p>
                    <p className="text-muted-foreground break-words">{r.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
