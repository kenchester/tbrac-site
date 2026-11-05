import type { Metadata } from "next"

// Private report links are never indexed.
export const metadata: Metadata = { title: "TBRAC restricted report", robots: { index: false, follow: false } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
