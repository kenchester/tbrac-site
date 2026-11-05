"use client";

// Last resort when the root layout itself fails: no providers or styles can be assumed.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "20vh 20px", color: "#0f172a" }}>
        <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
        <p style={{ color: "#475569" }}>It&apos;s on our side, and your saved work is safe. 出现了问题，请重试。</p>
        <button type="button" onClick={reset} style={{ marginTop: 16, padding: "8px 16px", background: "#0b1f3a", color: "white", border: 0, borderRadius: 6 }}>Try again / 重试</button>
      </body>
    </html>
  );
}
