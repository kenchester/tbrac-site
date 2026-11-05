import type React from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import { detectLanguage, LANGUAGE_COOKIE } from "@/lib/detect-language";
import { LanguageFloat } from "@/components/language-float";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://tbrac.org"),
  title: { default: "TBRAC - Trans-Border Risk Assessment and Certification", template: "%s · TBRAC" },
  description:
    "Comprehensive risk assessment and private certification for companies with Chinese ownership or ties entering the US market, relied on by counties, state agencies and partners.",
  openGraph: { siteName: "TBRAC", type: "website", locale: "en_US", alternateLocale: ["zh_CN"] },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const language = detectLanguage({
    pref: (await cookies()).get(LANGUAGE_COOKIE)?.value,
    country: h.get("x-vercel-ip-country"),
    acceptLanguage: h.get("accept-language"),
  });
  return (
    <html lang={language === "zh" ? "zh-CN" : "en"}>
      <body className={`${inter.className} antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow">
          Skip to content
        </a>
        <AuthProvider>
          <LanguageProvider initial={language}>
            {children}
            <LanguageFloat />
          </LanguageProvider>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
