"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, ChevronDown, Menu } from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/lib/language-context"

const NAVY = "#0b1f3a"
const SIGNUP = "/company/login?tab=signup"
const FULL_NAME = { en: "Trans-Border Risk Assessment and Certification", zh: "跨境风险评估与认证" }

const T = {
  en: {
    primary: [["/for-companies", "For companies"], ["/for-government", "For US public bodies"], ["/methodology", "Methodology"], ["/verify", "Verify a report"]],
    more: [["/#how", "How it works"], ["/relying-parties", "How to use a report"], ["/case-studies", "Use cases"], ["/faq", "FAQ"], ["/watch", "Status alerts"], ["/about", "About"], ["/contact", "Contact"]],
    moreLabel: "More", menu: "Menu", haveAccount: "Already have an account?", signIn: "Sign in", startFree: "Start free",
    menuNote: "Choose where to start",
    free: "Start the free self-assessment", freeNote: "Private, 10 short modules. Most companies start here.",
    full: "Explore a comprehensive assessment", fullNote: "Independent, committee-decided report for US counterparties.",
  },
  zh: {
    primary: [["/for-companies", "企业指南"], ["/for-government", "美国公共机构"], ["/methodology", "评估方法"], ["/verify", "核验报告"]],
    more: [["/#how", "评估流程"], ["/relying-parties", "如何使用报告"], ["/case-studies", "案例"], ["/faq", "常见问题"], ["/watch", "状态提醒"], ["/about", "关于我们"], ["/contact", "联系我们"]],
    moreLabel: "更多", menu: "菜单", haveAccount: "已有账户？", signIn: "登录", startFree: "免费开始",
    menuNote: "选择起点",
    free: "开始免费自我评估", freeNote: "保密，共 10 个简短模块。大多数企业从这里开始。",
    full: "了解全面评估", fullNote: "由委员会决定的独立报告，供美国交易方依赖。",
  },
}

function Wordmark({ showName }: { showName: boolean }) {
  const { language } = useLanguage()
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="TBRAC home">
      <span className="flex h-9 w-9 items-center justify-center rounded-sm text-sm font-bold tracking-tight text-white" style={{ background: NAVY }}>TB</span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-[0.18em] text-slate-900">TBRAC</span>
        {showName && <span className="hidden whitespace-nowrap text-[11px] text-slate-500 xl:block">{FULL_NAME[language] ?? FULL_NAME.en}</span>}
      </span>
    </Link>
  )
}

/**
 * Header for every public page. Desktop (lg+): four primary links, a "More" menu, sign in and the
 * free-start button on one line. Smaller screens: language, "Start free" and a menu button that opens
 * a panel with every link and both starting points, so nothing is only reachable on desktop.
 * `minimal` (evaluator and portal pages) shows only the wordmark and language switch.
 */
export function SiteHeader({ minimal = false, maxWidth = "max-w-6xl" }: { minimal?: boolean; maxWidth?: string }) {
  const { language } = useLanguage()
  const t = T[language] ?? T.en
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const active = (href: string) => href !== "/#how" && pathname?.startsWith(href)
  const link = (href: string) => `whitespace-nowrap transition-colors hover:text-slate-950 ${active(href) ? "font-semibold text-slate-950" : ""}`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className={`mx-auto flex h-16 ${maxWidth} items-center justify-between gap-4 px-5`}>
        <Wordmark showName={!minimal} />

        {!minimal && (
          <nav className="hidden items-center gap-6 text-sm text-slate-700 lg:flex" aria-label="Main">
            {t.primary.map(([href, label]) => <Link key={href} href={href} className={link(href)} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 whitespace-nowrap outline-none hover:text-slate-950">
                {t.moreLabel}<ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                {t.more.map(([href, label]) => <DropdownMenuItem key={href} asChild><Link href={href}>{label}</Link></DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageToggle />
          {!minimal && (
            <>
              <Link href="/company/login" className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 lg:block">{t.signIn}</Link>
              <Link href={SIGNUP} className="whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-semibold text-white sm:px-4" style={{ background: NAVY }}>{t.startFree}</Link>
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden" aria-label={t.menu}>
                  <Menu className="h-5 w-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-[88vw] gap-0 overflow-y-auto bg-white p-0 sm:max-w-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <SheetTitle className="text-[15px] font-bold tracking-[0.18em]">TBRAC</SheetTitle>
                    <SheetDescription className="text-xs text-slate-500">{FULL_NAME[language] ?? FULL_NAME.en}</SheetDescription>
                  </div>

                  <div className="space-y-3 border-b border-slate-200 px-5 py-5">
                    <p className="text-xs font-medium text-slate-500">{t.menuNote}</p>
                    <SheetClose asChild>
                      <Link href={SIGNUP} className="block rounded-md px-4 py-3 text-white" style={{ background: NAVY }}>
                        <span className="flex items-center justify-between text-sm font-semibold">{t.free}<ArrowRight className="h-4 w-4" /></span>
                        <span className="mt-0.5 block text-xs text-slate-300">{t.freeNote}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/#steps" className="block rounded-md border border-slate-300 px-4 py-3 hover:bg-slate-50">
                        <span className="flex items-center justify-between text-sm font-semibold">{t.full}<ArrowRight className="h-4 w-4" /></span>
                        <span className="mt-0.5 block text-xs text-slate-500">{t.fullNote}</span>
                      </Link>
                    </SheetClose>
                    <p className="pt-1 text-center text-sm text-slate-600">{t.haveAccount}{" "}
                      <SheetClose asChild><Link href="/company/login" className="font-semibold text-slate-900 underline-offset-2 hover:underline">{t.signIn}</Link></SheetClose>
                    </p>
                  </div>

                  <nav className="px-2 py-3" aria-label={t.menu}>
                    {[...t.primary, ...t.more].map(([href, label]) => (
                      <SheetClose asChild key={href}>
                        <Link href={href} aria-current={active(href) ? "page" : undefined}
                          className={`block rounded-md px-3 py-2.5 text-[15px] hover:bg-slate-50 ${active(href) ? "font-semibold text-slate-950" : "text-slate-700"}`}>{label}</Link>
                      </SheetClose>
                    ))}
                  </nav>

                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
