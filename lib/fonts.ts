import { Source_Serif_4 } from "next/font/google"

// Declared once and imported everywhere: repeated next/font/google declarations of the same font
// can trip an intermittent Turbopack build error on Vercel.
export const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"], display: "swap" })
