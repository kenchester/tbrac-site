"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { CompanyViewBanner } from "@/components/company-view-banner";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAVY = "#0b1f3a";
const FULL_NAME = { en: "Trans-Border Risk Assessment and Certification", zh: "跨境风险评估与认证" };
const T = {
  en: { overview: "Overview", self: "Self-assessment", docs: "Documents", requests: "Document requests", findings: "Draft findings",
        signOut: "Sign out", menu: "Menu", account: "Signed in as", portal: "Company portal" },
  zh: { overview: "概览", self: "自我评估", docs: "文件", requests: "文件请求", findings: "调查结果草稿",
        signOut: "退出登录", menu: "菜单", account: "当前账户", portal: "企业门户" },
};

/** Header for the signed-in company pages: wordmark, company sections, language and account. */
export function PortalHeader() {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const customerId = /^\/customers\/([0-9a-f-]{36})/.exec(pathname)?.[1];
  const home = customerId ? `/customers/${customerId}` : "/company/profile";

  const nav = customerId ? [
    { href: home, label: t.overview, exact: true },
    { href: `${home}#self-assessment`, label: t.self, match: `${home}/assessments` },
    { href: `${home}/documents`, label: t.docs },
    { href: `${home}/requests`, label: t.requests },
  ] : [];
  const isActive = (n: { href: string; exact?: boolean; match?: string }) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.match ?? n.href);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-8">
          <Link href={home} className="flex shrink-0 items-center gap-3" aria-label="TBRAC">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm text-sm font-bold text-white" style={{ background: NAVY }}>TB</span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-[0.18em] text-slate-900">TBRAC</span>
              <span className="hidden whitespace-nowrap text-[11px] text-slate-500 xl:block">{FULL_NAME[language] ?? FULL_NAME.en}</span>
            </span>
          </Link>
          {nav.length > 0 && (
            <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label={t.portal}>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} aria-current={isActive(n) ? "page" : undefined}
                  className={`whitespace-nowrap rounded-md px-3 py-2 transition-colors ${isActive(n) ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 outline-none hover:bg-slate-50 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: NAVY }}>
                  {user.email?.[0]?.toUpperCase()}
                </span>
                <span className="max-w-[180px] truncate">{user.email}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-slate-500">{t.account}</p>
                  <p className="truncate text-sm font-medium">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />{t.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden" aria-label={t.menu}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] gap-0 overflow-y-auto bg-white p-0 sm:max-w-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <SheetTitle className="text-[15px] font-bold tracking-[0.18em]">TBRAC</SheetTitle>
                <SheetDescription className="text-xs text-slate-500">{FULL_NAME[language] ?? FULL_NAME.en}</SheetDescription>
              </div>
              {nav.length > 0 && (
                <nav className="px-2 py-3" aria-label={t.portal}>
                  {nav.map((n) => (
                    <SheetClose asChild key={n.href}>
                      <Link href={n.href} className={`block rounded-md px-3 py-2.5 text-[15px] hover:bg-slate-50 ${isActive(n) ? "font-semibold text-slate-950" : "text-slate-700"}`}>{n.label}</Link>
                    </SheetClose>
                  ))}
                </nav>
              )}
              {user && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <p className="text-xs text-slate-500">{t.account}</p>
                  <p className="truncate text-sm font-medium">{user.email}</p>
                  <button type="button" onClick={handleSignOut}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
                    <LogOut className="h-4 w-4" />{t.signOut}
                  </button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {customerId && <CompanyViewBanner customerId={customerId} />}
    </header>
  );
}
