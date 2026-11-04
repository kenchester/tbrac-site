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
  title: "TBRAC - Trans-Border Risk Assessment and Certification",
  description:
    "Comprehensive risk assessment for companies with Chinese ownership or ties entering the US market, relied on by counties, state agencies and partners.",
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
