"use client"

import { LegalPage, type LegalBlock } from "@/components/legal-page"
import { useLanguage } from "@/lib/language-context"

const EMAIL = "evaluations@tbrac.org"

const C: Record<"en" | "zh", { title: string; lead: string; updated: string; blocks: LegalBlock[] }> = {
  en: {
    title: "Terms of service",
    lead: "The terms for using tbrac.org, the free self-assessment and TBRAC reports.",
    updated: "Effective November 5, 2026",
    blocks: [
      { h: "Agreement", p: [
        `These terms are an agreement between you and Assurance Pacific Assessments LLC ("TBRAC", "we"), which operates TBRAC at tbrac.org. By creating an account or using the site you accept them. If you use TBRAC for a company, you confirm you are authorized to act for it, and these terms bind the company.`,
        "A comprehensive assessment is also governed by its signed engagement letter. Where the engagement letter and these terms differ, the engagement letter prevails.",
      ] },
      { h: "Your account", list: [
        "Give accurate information and keep it up to date.",
        "Keep your sign-in details secure; you are responsible for activity under your account. Tell us at once if you suspect misuse.",
        "One account represents one company.",
      ] },
      { h: "The free self-assessment", list: [
        "The self-assessment is based only on your own answers, which TBRAC does not verify. Its score and red flags are indicative, for your own preparation.",
        "It is not a comprehensive assessment or a TBRAC certification, and must not be presented to anyone as one.",
      ] },
      { h: "Comprehensive assessments and TBRAC certification", list: [
        "A TBRAC report is a private certification issued by Assurance Pacific Assessments LLC under its published methodology, as of the date stated. It is not a government certification, approval or license; not a CFIUS determination or a decision of any government agency; not legal advice; and not a guarantee of the company's future conduct. It does not override any law.",
        "The rating follows the evidence. TBRAC does not promise any particular rating, and the flat fee does not depend on the outcome. The company sees the draft factual findings and may correct them before the committee decides.",
        "A rating is valid for the period stated and is monitored during it. It can be placed Under Review, affirmed, reopened, withdrawn or expire; its current status is always shown at tbrac.org/verify. A report whose status is not Current must not be presented as current.",
        "The full report may be relied on only by the intended users named for the engagement, under their reliance letters. Anyone may check the public summary and status.",
        "TBRAC may decline or end an engagement, or withdraw a rating, if it cannot remain independent, if the evidence cannot support an opinion, or if information provided to it was false or misleading.",
      ] },
      { h: "Information and documents you provide", list: [
        "You keep ownership of what you provide. You allow TBRAC to store, process, analyze and cite it as needed to provide the services and keep the records described in the privacy policy.",
        "You confirm that what you provide is accurate and that you may lawfully provide it, including under the laws of the country where it originates.",
        "Officer attestations must be given by the officer named, personally. TBRAC staff may help you prepare information, but attestations, refusals and the company's reply are the company's own.",
      ] },
      { h: "Using reports and the TBRAC name", list: [
        "You may share a report you received with the people entitled to rely on it, together with its report number so they can verify it.",
        "Do not alter a report or its public summary, quote it selectively in a way that changes its meaning, or use the TBRAC name or marks to suggest a certification or rating TBRAC has not issued.",
      ] },
      { h: "AI features", p: [
        "Some features use AI, such as the self-assessment assistant and reading aids for evaluators. AI output can be wrong and is guidance only. In comprehensive assessments, AI is used only with the company's consent, and TBRAC's evaluators and committee make every decision.",
      ] },
      { h: "Acceptable use", list: [
        "Do not try to access accounts, data or systems you are not authorized to use, or test the security of the service without our written permission.",
        "Do not scrape the public register in bulk, overload the service, or use it to break any law, including sanctions and export-control laws.",
      ] },
      { h: "Disclaimers and limits of liability", p: [
        "Except as stated in these terms or a signed engagement letter, the site and the free self-assessment are provided as is. Decisions about investments, incentives, land, leases, contracts and approvals are made by the parties concerned, not by TBRAC.",
        "To the extent the law allows, TBRAC is not liable for indirect or consequential losses, and its total liability in connection with the services is limited to the fees paid to TBRAC for the engagement concerned in the 12 months before the claim (or US$100 for free services). Nothing in these terms limits liability that cannot be limited by law.",
      ] },
      { h: "Ending use", p: [
        "You may stop using TBRAC and delete your company account at any time; the privacy policy explains what is kept afterwards. We may suspend or close accounts that break these terms.",
      ] },
      { h: "Changes and contact", p: [
        `We may update these terms. We will change the date above and tell account holders by email about significant changes; continuing to use TBRAC after that means you accept them. Questions: ${EMAIL}.`,
      ] },
    ],
  },
  zh: {
    title: "服务条款",
    lead: "使用 tbrac.org、免费自我评估及 TBRAC 报告的条款。",
    updated: "生效日期：2026 年 11 月 5 日",
    blocks: [
      { h: "协议", p: [
        `本条款是您与运营 TBRAC（tbrac.org）的 Assurance Pacific Assessments LLC（“TBRAC”或“我们”）之间的协议。创建账户或使用本网站即表示您接受本条款。如您代表企业使用 TBRAC，即确认您有权代表该企业行事，本条款对该企业具有约束力。`,
        "全面评估同时受双方签署的委托书约束。委托书与本条款不一致的，以委托书为准。",
      ] },
      { h: "您的账户", list: [
        "提供准确的信息并及时更新。",
        "妥善保管登录信息；您对账户下的活动负责。如怀疑账户被滥用，请立即通知我们。",
        "一个账户代表一家企业。",
      ] },
      { h: "免费自我评估", list: [
        "自我评估仅基于您自己的回答，TBRAC 不予核实。其评分和风险信号仅供参考，用于贵公司自行准备。",
        "自我评估不是全面评估，也不是 TBRAC 认证，不得向任何人表述为全面评估或认证。",
      ] },
      { h: "全面评估与 TBRAC 认证", list: [
        "TBRAC 报告是 Assurance Pacific Assessments LLC 依据其公开的评估方法、截至所述日期出具的私营机构认证。它不是政府认证、批准或许可；不是 CFIUS 决定，也不是任何政府机构的决定；不构成法律意见；也不保证企业未来的行为。它不能凌驾于任何法律之上。",
        "评级以证据为依据。TBRAC 不承诺任何特定评级，固定费用也不取决于评估结果。企业可在委员会作出决定前查看并更正事实性调查结果草稿。",
        "评级在所述期间内有效并受到持续监测。评级可能进入“审查中”、获得确认、重新评级、被撤回或过期；其当前状态始终显示在 tbrac.org/verify。状态不是“有效”的报告，不得表述为有效。",
        "完整报告仅可由该评估指定的预期使用方依据其依赖函予以依赖。任何人均可查询公开摘要和状态。",
        "如 TBRAC 无法保持独立、证据不足以支持意见，或所获信息虚假或具有误导性，TBRAC 可拒绝或终止评估，或撤回评级。",
      ] },
      { h: "您提供的信息和文件", list: [
        "您保留所提供内容的所有权。您许可 TBRAC 为提供服务及保存隐私政策所述记录之需要，存储、处理、分析和引用这些内容。",
        "您确认所提供的内容准确，且您有权依法提供，包括依据其来源国的法律。",
        "高管声明必须由所列高管本人作出。TBRAC 工作人员可以协助您准备信息，但声明、拒绝提供及企业的回复意见均须由企业本身作出。",
      ] },
      { h: "报告及 TBRAC 名称的使用", list: [
        "您可以将收到的报告连同报告编号提供给有权依赖该报告的人员，以便其核验。",
        "不得篡改报告或其公开摘要，不得以改变原意的方式断章取义，也不得使用 TBRAC 名称或标志暗示 TBRAC 未出具的认证或评级。",
      ] },
      { h: "AI 功能", p: [
        "部分功能使用 AI，例如自我评估助手和评估人员的阅读辅助工具。AI 输出可能有误，仅供参考。在全面评估中，AI 仅在企业同意后使用，所有决定均由 TBRAC 评估人员和委员会作出。",
      ] },
      { h: "可接受的使用", list: [
        "不得试图访问未经授权的账户、数据或系统，未经我们书面许可不得测试本服务的安全性。",
        "不得批量抓取公开登记册、使服务过载，或利用本服务违反任何法律，包括制裁和出口管制法律。",
      ] },
      { h: "免责声明与责任限制", p: [
        "除本条款或已签署的委托书另有规定外，本网站和免费自我评估按现状提供。有关投资、激励、土地、租赁、合同和审批的决定由相关各方作出，而非由 TBRAC 作出。",
        "在法律允许的范围内，TBRAC 不对间接或后果性损失承担责任，其与服务相关的全部责任以索赔前 12 个月内就相关评估向 TBRAC 支付的费用为限（免费服务为 100 美元）。本条款不限制法律规定不得限制的责任。",
      ] },
      { h: "终止使用", p: [
        "您可以随时停止使用 TBRAC 并删除企业账户；删除后保留哪些内容见隐私政策。对于违反本条款的账户，我们可以暂停或关闭。",
      ] },
      { h: "条款变更与联系方式", p: [
        `我们可能更新本条款。我们将更新上方日期，并就重大变更通过电子邮件通知账户持有人；此后继续使用 TBRAC 即表示您接受变更。如有疑问，请联系：${EMAIL}。`,
      ] },
    ],
  },
}

export default function TermsPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  return <LegalPage title={c.title} lead={c.lead} updated={c.updated} blocks={c.blocks} />
}
