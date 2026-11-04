"use client"

import { useEffect, useState } from "react"
import { Languages } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

/** Language switch for pages whose header has none (hidden when a header switch is on the page, and in print). */
export function LanguageFloat() {
  const { language, setLanguage, toggles } = useLanguage()
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 0); return () => clearTimeout(t) }, [])
  if (!ready || toggles > 0) return null
  return (
    <button type="button" onClick={() => setLanguage(language === "en" ? "zh" : "en")}
      className="print:hidden fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/95 px-3 py-1.5 text-sm font-medium text-slate-800 shadow-md backdrop-blur hover:bg-slate-50"
      title={language === "en" ? "切换到中文" : "Switch to English"} aria-label={language === "en" ? "切换到中文" : "Switch to English"}>
      <Languages className="h-4 w-4" />{language === "en" ? "中文" : "English"}
    </button>
  )
}
