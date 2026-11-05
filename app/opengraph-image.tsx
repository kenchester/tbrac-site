import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TBRAC · Trans-Border Risk Assessment and Certification";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b1f3a", color: "white", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, background: "white", color: "#0b1f3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700 }}>TB</div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 8 }}>TBRAC</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>Trans-Border Risk Assessment and Certification</div>
          <div style={{ fontSize: 30, color: "#cbd5e1" }}>An independent view of the risks US decision-makers ask about</div>
        </div>
        <div style={{ fontSize: 24, color: "#cbd5e1" }}>tbrac.org</div>
      </div>
    ),
    size,
  );
}
