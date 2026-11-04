"use client"

import { useLanguage } from "@/lib/language-context"

/** Copyright line for public pages. */
export function Copyright({ className = "" }: { className?: string }) {
  const { language } = useLanguage()
  return (
    <footer className={`border-t border-slate-200 py-6 text-center text-xs text-slate-500 ${className}`}>
      © {new Date().getFullYear()} Assurance Pacific Assessments LLC. {language === "zh" ? "保留所有权利。" : "All rights reserved."}
    </footer>
  )
}
