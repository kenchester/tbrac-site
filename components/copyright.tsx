"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

/** Footer line for every page: copyright, privacy policy and terms. */
export function Copyright({ className = "" }: { className?: string }) {
  const { language } = useLanguage()
  const zh = language === "zh"
  return (
    <footer className={`border-t border-slate-200 py-6 text-center text-xs text-slate-500 ${className}`}>
      © {new Date().getFullYear()} Assurance Pacific Assessments LLC. {zh ? "保留所有权利。" : "All rights reserved."}
      <span className="mx-2">·</span><Link href="/privacy" className="hover:text-slate-900">{zh ? "隐私政策" : "Privacy policy"}</Link>
      <span className="mx-2">·</span><Link href="/terms" className="hover:text-slate-900">{zh ? "服务条款" : "Terms of service"}</Link>
    </footer>
  )
}
