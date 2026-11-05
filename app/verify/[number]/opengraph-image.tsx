import { ImageResponse } from "next/og";
import { publicReport, TIER_LABEL } from "@/lib/public-report";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TBRAC report status";

// The preview card shown when a verify link is shared (email, chat, social).
export default async function Image({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const r = await publicReport(decodeURIComponent(number));
  const good = r?.status === "Current" && !r?.test;
  const latin = (s: string) => s.replace(/[^\u0000-ɏ·–—’]/g, "").trim();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b1f3a", color: "white", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, background: "white", color: "#0b1f3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 }}>TB</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6 }}>TBRAC</div>
            <div style={{ fontSize: 20, color: "#cbd5e1" }}>Trans-Border Risk Assessment and Certification</div>
          </div>
        </div>
        {r ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{latin(r.subject) || r.report_number}</div>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <div style={{ fontSize: 36 }}>{r.tier ? TIER_LABEL[r.tier] ?? r.tier : "Report"}</div>
              <div style={{ fontSize: 28, fontWeight: 700, padding: "8px 20px", borderRadius: 999, background: good ? "#d1fae5" : "#fef3c7", color: good ? "#065f46" : "#78350f" }}>
                {r.test ? "TEST REPORT" : r.status}</div>
            </div>
          </div>
        ) : <div style={{ fontSize: 56, fontWeight: 700 }}>Verify a TBRAC report</div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#cbd5e1" }}>
          <div>{r ? `Report ${r.report_number}` : ""}</div>
          <div>Check live status, fingerprint and signature at tbrac.org/verify</div>
        </div>
      </div>
    ),
    size,
  );
}
