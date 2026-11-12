import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Comprehensive assessment",
  description: "Early access to the TBRAC comprehensive assessment: an independent private certification US counterparties can rely on.",
  robots: { index: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
