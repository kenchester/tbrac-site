"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Languages } from "lucide-react"
import { useEffect } from "react"

export function LanguageToggle() {
  const { language, setLanguage, registerToggle } = useLanguage()
  useEffect(() => registerToggle(), []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "zh" : "en")}
      className="gap-2"
      title={language === "en" ? "Switch to Chinese" : "切换到英文"}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">{language === "en" ? "中文" : "English"}</span>
    </Button>
  )
}
