"use client"

import { SiteHeader } from "@/components/site-header"

/** Kept for existing imports. Public pages get the full header; pass `minimal` on portal pages. */
export function Header({ minimal = false }: { minimal?: boolean }) {
  return <SiteHeader minimal={minimal} />
}
