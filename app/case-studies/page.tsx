"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ArrowRight, Building2, Battery, Code2 } from "lucide-react"

const CASE_STUDIES = [
  {
    icon: Building2,
    iconColor: "text-red-500",
    iconBg: "bg-red-500/10",
    tag: "AI / National Security",
    tagVariant: "destructive" as const,
    company: "Major AI Systems Provider",
    location: "Shenzhen, China",
    riskBefore: "Very High",
    riskAfter: "Medium",
    riskColor: "text-amber-600",
    summary:
      "A leading Chinese AI company developed advanced facial recognition technology and sought a contract to deploy it across US airport security checkpoints. Given their sector and government adjacency, their initial TBRAC screening flagged immediate exposure across multiple dimensions.",
    findings: [
      "Mandatory CFIUS filing required — transaction met TID US Business threshold under FIRRMA",
      "Company name appeared on DoD 1260H list of Chinese military-civil fusion entities",
      "CCP party committee embedded at board level with no independent US governance structure",
    ],
    outcome:
      "TBRAC's early identification gave the company 8 months to restructure before filing. They established a US subsidiary with a fully independent board, removed party committee representation from governance documents, and engaged CFIUS counsel proactively. The transaction cleared review. Risk tier: Very High → Medium.",
  },
  {
    icon: Battery,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    tag: "EV / Manufacturing",
    tagVariant: "secondary" as const,
    company: "Jiangsu Power Solutions Group",
    location: "Jiangsu, China",
    riskBefore: "High",
    riskAfter: "Low",
    riskColor: "text-green-600",
    summary:
      "A major EV battery manufacturer sought to become a Tier-1 supplier to a top-three US automaker. The deal involved significant IP transfer and a proposed joint venture. A 32% stake held by a provincial state-owned enterprise created material CFIUS exposure.",
    findings: [
      "SOE ownership at 32% exceeded thresholds for critical technology supplier classification",
      "US customer data — including vehicle telemetry — routed through servers in Nanjing with no data localization controls",
      "Export Control Classification (ECCN 3E001) not assessed for battery chemistry formulations transferred to US JV",
    ],
    outcome:
      "The company reduced SOE stake to 8% through a secondary share offering, established a US-based data subsidiary with isolated infrastructure, and completed an ECCN classification analysis. CFIUS review completed without mitigation agreement. Certified Low risk in 14 weeks.",
  },
  {
    icon: Code2,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    tag: "Enterprise SaaS",
    tagVariant: "outline" as const,
    company: "Beijing Workforce Technologies",
    location: "Beijing, China",
    riskBefore: "Medium",
    riskAfter: "Low",
    riskColor: "text-green-600",
    summary:
      "A Beijing-based HR software company targeting Fortune 500 US clients had a relatively clean profile — fully private ownership, no government contracts, and strong IP documentation. TBRAC was used to identify the remaining gaps before a US sales launch.",
    findings: [
      "No US employment law compliance framework for software handling US employee PII (CCPA, BIPA gaps)",
      "Financial statements not prepared under US GAAP or audited by a PCAOB-registered firm",
      "Vendor agreements with two entities on BIS Unverified List flagged in supply chain screen",
    ],
    outcome:
      "The company engaged a US employment counsel to implement a CCPA-compliant data handling framework, transitioned to a PCAOB-registered auditor, and replaced the flagged vendors. Entity list screening returned clean. Achieved Low risk certification in 6 weeks with no structural changes required.",
  },
]

const riskBadgeClass: Record<string, string> = {
  "Very High": "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-green-100 text-green-700 border-green-200",
}

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-accent py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary-foreground mb-4">
            Case Studies
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            How companies use TBRAC to identify risk early, remediate strategically, and enter the US market with confidence.
          </p>
          <p className="mt-4 text-sm text-primary-foreground/75 max-w-2xl mx-auto">
            Client names and identifying details have been changed to protect confidentiality. Outcomes reflect each client&apos;s
            own remediation and decisions by the relevant authorities; past results do not guarantee future outcomes.
          </p>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-10">
            {CASE_STUDIES.map((cs, i) => {
              const Icon = cs.icon
              return (
                <Card key={i} className="border-border">
                  <CardContent className="p-8">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                      <div className={`flex-shrink-0 h-12 w-12 rounded-lg ${cs.iconBg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${cs.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant={cs.tagVariant} className="text-xs">{cs.tag}</Badge>
                          <span className="text-xs text-muted-foreground">{cs.location}</span>
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{cs.company}</h2>
                      </div>
                      {/* Risk tier change */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-1 rounded border ${riskBadgeClass[cs.riskBefore]}`}>
                          {cs.riskBefore}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs font-semibold px-2 py-1 rounded border ${riskBadgeClass[cs.riskAfter]}`}>
                          {cs.riskAfter}
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-muted-foreground leading-relaxed mb-6">{cs.summary}</p>

                    {/* Key findings */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                        Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {cs.findings.map((f, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcome */}
                    <div className="border-t border-border pt-5">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
                        Outcome
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{cs.outcome}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
