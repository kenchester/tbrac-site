"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Language } from "./translations"
import { translations } from "./translations"
import { LANGUAGE_COOKIE } from "./detect-language"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  /** Header language switches register here, so the floating switch only shows on pages without one. */
  registerToggle: () => () => void
  toggles: number
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/** `initial` is decided on the server (app/layout.tsx, lib/detect-language.ts), so the first paint is in the right language. */
export function LanguageProvider({ children, initial = "en" }: { children: ReactNode; initial?: Language }) {
  const [language, setLanguageState] = useState<Language>(initial)
  const [toggles, setToggles] = useState(0)
  const registerToggle = () => {
    setToggles((n) => n + 1)
    return () => setToggles((n) => n - 1)
  }

  // Older visits stored the manual choice only in localStorage: honor it once and move it to the cookie.
  useEffect(() => {
    const saved = localStorage.getItem("tbrac-language")
    if ((saved === "en" || saved === "zh") && !document.cookie.includes(`${LANGUAGE_COOKIE}=`)) {
      document.cookie = `${LANGUAGE_COOKIE}=${saved}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      setLanguageState(saved)
    }
  }, [])

  useEffect(() => { document.documentElement.lang = language === "zh" ? "zh-CN" : "en" }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("tbrac-language", lang)
    document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }

  const t = (key: string): string => translations[language][key as keyof typeof translations.en] || key

  return <LanguageContext.Provider value={{ language, setLanguage, t, registerToggle, toggles }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) throw new Error("useLanguage must be used within a LanguageProvider")
  return context
}
