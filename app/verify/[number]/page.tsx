import type { Metadata } from "next";
import { VerifyResult } from "@/components/verify-view";
import { publicReport, TIER_LABEL } from "@/lib/public-report";

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const { number } = await params;
  const r = await publicReport(decodeURIComponent(number));
  if (!r) return { title: "Report verification · TBRAC" };
  const title = `${r.subject}: TBRAC ${r.tier ? TIER_LABEL[r.tier] ?? r.tier : "report"} · ${r.status}`;
  const description = `${r.test ? "TEST REPORT. " : ""}TBRAC report ${r.report_number}. Live status: ${r.status}. A private certification by Assurance Pacific Assessments LLC; check its fingerprint and signature here.`;
  return { title, description, openGraph: { title, description, type: "website", siteName: "TBRAC" }, twitter: { card: "summary_large_image", title, description } };
}

export default async function VerifyNumberPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <VerifyResult number={decodeURIComponent(number).toUpperCase()} />;
}
