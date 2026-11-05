"use client"

import { LegalPage, type LegalBlock } from "@/components/legal-page"
import { useLanguage } from "@/lib/language-context"

const UPDATED = { en: "Effective November 5, 2026", zh: "生效日期：2026 年 11 月 5 日" }
const EMAIL = "evaluations@tbrac.org"

type Block = { h: string; p?: string[]; list?: string[]; table?: [string, string, string][] }

const C: Record<"en" | "zh", { title: string; lead: string; blocks: Block[]; providerHead: [string, string, string] }> = {
  en: {
    title: "Privacy policy",
    lead: "How Assurance Pacific Assessments LLC, which operates TBRAC at tbrac.org, collects, uses, shares, keeps and protects information.",
    providerHead: ["Provider", "What it does for TBRAC", "Location"],
    blocks: [
      { h: "Who we are", p: [`TBRAC (Trans-Border Risk Assessment and Certification) is operated by Assurance Pacific Assessments LLC ("TBRAC", "we"). Questions about this policy or your information: ${EMAIL}.`] },
      { h: "What we collect", list: [
        "Account details: your email address, name and password (stored only as a one-way hash). Staff accounts also use two-factor sign-in.",
        "Sign-in sessions: the time, IP address and browser of each session, to keep accounts secure.",
        "Company information you enter: the company profile, self-assessment answers, requests for a comprehensive assessment (including contact name, title and phone), responses to document requests, officer attestations and the company's right-of-reply response.",
        "Documents you upload, and the text TBRAC extracts from them (including by optical character recognition) so evaluators can read and cite them.",
        "Questions you put to the AI assistant during the self-assessment. These are sent to the AI provider to produce an answer; TBRAC does not keep a transcript.",
        "Information from other sources during a comprehensive assessment: official company registries, US government screening lists, court and enforcement records, news, and opinions of the company's counsel.",
        "A record of activity: who viewed or changed what and when, including every time a TBRAC evaluator opens a company document, and every change TBRAC staff make while assisting a company.",
      ] },
      { h: "How we use it", list: [
        "To run the free self-assessment and show you its indicative results.",
        "To carry out comprehensive assessments under the published TBRAC methodology, issue reports and certifications, and monitor issued ratings during their validity.",
        "To send service emails: password resets, document requests, notices that draft findings are ready, and status-change notices.",
        "To keep the service secure, investigate misuse, and keep the audit records an assurance service needs.",
        "We do not sell information, use it for advertising, or use your documents to train AI models.",
      ] },
      { h: "Who can see it", list: [
        "Self-assessment: only your company's account. TBRAC staff see it only if you ask them for help; each such session is recorded and listed on your dashboard.",
        "Comprehensive assessment: the TBRAC analysts, reviewers and committee members working on it (including independent external committee members bound by confidentiality), and counsel advising TBRAC.",
        "Reports: the full report goes only to the intended users named for the engagement, such as the county or agency that relies on it, after they countersign a reliance letter. The public register at tbrac.org/verify shows only the public summary: company name, rating, confidence, outlook, domain ratings, dates and current status.",
        "Status notices: when a rating's status changes, the people listed to receive notices and the company are emailed the public status only.",
        "When the law requires it, or to protect the rights and safety of TBRAC, our clients or others.",
      ] },
      { h: "Service providers", p: ["TBRAC uses these providers to run the service. Each processes information only to provide its service to TBRAC."] ,
        table: [
          ["Vercel", "Hosts the website and application; stores uploaded files privately; counts page visits without cookies (Vercel Web Analytics)", "United States"],
          ["Neon", "Database", "United States (US East)"],
          ["Resend", "Delivers service emails", "United States"],
          ["Groq", "AI processing: the self-assessment assistant; and, in a comprehensive assessment only with the company's written consent, AI reading aids for evaluators", "United States"],
          ["GitHub", "Stores TBRAC's source code and runs the daily monitoring job", "United States"],
          ["US International Trade Administration (trade.gov)", "Names of companies and people being screened are checked against the US Consolidated Screening List", "United States"],
        ] },
      { h: "Where information is kept", p: [
        "TBRAC stores information in the United States.",
        "If your documents contain personal information or data regulated by the laws of the People's Republic of China or another country, you are responsible for any consent, approval or security assessment those laws require before you send it to TBRAC. Tell us if you need to redact or withhold an item; a refusal is recorded rather than held against you without explanation.",
      ] },
      { h: "How long we keep it", list: [
        "Self-assessment accounts: until you delete your documents or your company account. A deleted account and its documents are permanently deleted 30 days later, unless the company has had a comprehensive assessment.",
        "Comprehensive assessments: documents and extracted text are kept for 7 years after the company's last engagement closes (when its rating expires or is withdrawn), so the rating can be explained or defended, and are then deleted. The engagement record, evidence notes, audit trail and the public register entry are kept as the record of the certification.",
        "Records of a deletion (who deleted what, and when) are kept; the deleted content is not.",
      ] },
      { h: "How we protect it", list: [
        "All traffic is encrypted (HTTPS), and our providers encrypt stored data.",
        "Uploaded files are stored privately and are only served to signed-in users allowed to see them.",
        "Evaluators must sign in with two-factor authentication, and every evaluator access to a company document is logged.",
        "Files are checked to be what they claim to be before any processing.",
        "No system is perfectly secure. If a breach affects your information, we will tell you as the law requires.",
      ] },
      { h: "Cookies", p: ["TBRAC uses only cookies needed to run the site: a sign-in session cookie and a cookie that remembers your language choice. We do not use advertising or cross-site tracking cookies."] },
      { h: "Your choices", list: [
        "See and correct your company information in your account at any time.",
        "Delete documents you uploaded, unless they were submitted as evidence in a comprehensive assessment in progress, and delete your company account.",
        "During a comprehensive assessment, correct the draft factual findings through the right of reply before any decision.",
        `Ask for a copy of your information, or ask questions or make a complaint: ${EMAIL}. Depending on where you live, you may have further rights under local law; we will respond as that law requires.`,
      ] },
      { h: "Changes", p: ["If we change this policy we will update the date above, and tell account holders by email about significant changes."] },
    ],
  },
  zh: {
    title: "隐私政策",
    lead: "运营 TBRAC（tbrac.org）的 Assurance Pacific Assessments LLC 如何收集、使用、共享、保存和保护信息。",
    providerHead: ["服务商", "为 TBRAC 提供的服务", "所在地"],
    blocks: [
      { h: "我们是谁", p: [`TBRAC（跨境风险评估与认证）由 Assurance Pacific Assessments LLC（“TBRAC”或“我们”）运营。如对本政策或您的信息有任何疑问，请联系：${EMAIL}。`] },
      { h: "我们收集的信息", list: [
        "账户信息：您的电子邮箱、姓名和密码（仅以单向哈希形式保存）。工作人员账户还需使用双重身份验证登录。",
        "登录会话：每次会话的时间、IP 地址和浏览器信息，用于保障账户安全。",
        "您填写的企业信息：企业资料、自我评估回答、全面评估申请（包括联系人姓名、职务和电话）、对文件请求的回复、高管声明以及企业的回复意见。",
        "您上传的文件，以及 TBRAC 从中提取的文本（包括通过光学字符识别），以便评估人员阅读和引用。",
        "您在自我评估中向 AI 助手提出的问题。这些问题会发送给 AI 服务商以生成回答；TBRAC 不保存对话记录。",
        "全面评估期间来自其他来源的信息：官方企业登记机构、美国政府筛查名单、法院和执法记录、新闻报道以及企业律师的意见。",
        "活动记录：何人在何时查看或更改了何种内容，包括 TBRAC 评估人员每次打开企业文件的记录，以及 TBRAC 工作人员协助企业期间所作的每项更改。",
      ] },
      { h: "我们如何使用信息", list: [
        "运行免费自我评估并向您显示参考结果。",
        "依据公开的 TBRAC 评估方法开展全面评估、出具报告和认证，并在评级有效期内持续监测。",
        "发送服务邮件：密码重置、文件请求、调查结果草稿通知以及状态变更通知。",
        "保障服务安全、调查滥用行为，并保存鉴证服务所需的审计记录。",
        "我们不出售信息，不将信息用于广告，也不使用您的文件训练 AI 模型。",
      ] },
      { h: "谁可以查看", list: [
        "自我评估：仅限贵公司账户。只有在您请求协助时，TBRAC 工作人员才能查看；每次协助都会被记录并列示在您的概览页面。",
        "全面评估：参与该评估的 TBRAC 分析师、审核人和委员会成员（包括负有保密义务的独立外部委员），以及为 TBRAC 提供意见的律师。",
        "报告：完整报告仅提供给该评估指定的预期使用方（例如依赖报告的县政府或机构），且须其会签依赖函。tbrac.org/verify 公开登记册仅显示公开摘要：企业名称、评级、可信度、展望、各领域评级、日期和当前状态。",
        "状态通知：评级状态变更时，仅向列为通知对象的人员和企业发送公开状态。",
        "法律要求时，或为保护 TBRAC、我们的客户或他人的权利与安全时。",
      ] },
      { h: "服务商", p: ["TBRAC 使用以下服务商运营服务。各服务商仅为向 TBRAC 提供其服务而处理信息。"],
        table: [
          ["Vercel", "托管网站和应用；以非公开方式存储上传的文件；在不使用 Cookie 的情况下统计页面访问量（Vercel Web Analytics）", "美国"],
          ["Neon", "数据库", "美国（美东）"],
          ["Resend", "发送服务邮件", "美国"],
          ["Groq", "AI 处理：自我评估助手；在全面评估中，仅经企业书面同意后，为评估人员提供 AI 阅读辅助", "美国"],
          ["GitHub", "存储 TBRAC 源代码并运行每日监测任务", "美国"],
          ["美国国际贸易管理局（trade.gov）", "将被筛查的企业和人员名称与美国综合筛查名单进行比对", "美国"],
        ] },
      { h: "信息存储地点", p: [
        "TBRAC 将信息存储在美国。",
        "如您的文件包含受中华人民共和国或其他国家法律监管的个人信息或数据，您应在向 TBRAC 提供前，自行取得相关法律要求的同意、批准或安全评估。如需对某项内容进行删节或不予提供，请告知我们；拒绝提供将被如实记录，而不会在不作说明的情况下对您不利。",
      ] },
      { h: "保存期限", list: [
        "自我评估账户：保存至您删除文件或企业账户为止。已删除的账户及其文件将在 30 天后永久删除，除非该企业曾接受全面评估。",
        "全面评估：文件及提取文本在企业最后一次评估结束（评级过期或被撤回）后保存 7 年，以便对评级作出解释或抗辩，之后予以删除。评估记录、证据说明、审计记录和公开登记条目作为认证记录予以保留。",
        "删除记录（何人在何时删除了何种内容）会被保留，但被删除的内容不会保留。",
      ] },
      { h: "我们如何保护信息", list: [
        "所有传输均经加密（HTTPS），我们的服务商对存储的数据进行加密。",
        "上传的文件以非公开方式存储，仅提供给有权查看的已登录用户。",
        "评估人员必须使用双重身份验证登录，评估人员每次访问企业文件都会被记录。",
        "文件在处理前会被核验其真实格式。",
        "任何系统都无法做到绝对安全。如发生影响您信息的安全事件，我们将按法律要求通知您。",
      ] },
      { h: "Cookie", p: ["TBRAC 仅使用网站运行所必需的 Cookie：登录会话 Cookie 和记住您语言选择的 Cookie。我们不使用广告或跨站跟踪 Cookie。"] },
      { h: "您的选择", list: [
        "随时在账户中查看和更正企业信息。",
        "删除您上传的文件（已在进行中的全面评估中作为证据提交的文件除外），以及删除企业账户。",
        "在全面评估中，于任何决定作出前通过回复意见更正事实性调查结果草稿。",
        `索取您的信息副本，或提出问题、投诉：${EMAIL}。根据您所在地的法律，您可能享有更多权利，我们将按该法律的要求作出回应。`,
      ] },
      { h: "政策变更", p: ["如本政策发生变更，我们将更新上方日期，并就重大变更通过电子邮件通知账户持有人。"] },
    ],
  },
}

export default function PrivacyPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  const blocks: LegalBlock[] = c.blocks.map((b) => ({ ...b, table: b.table ? { head: c.providerHead, rows: b.table } : undefined }))
  return <LegalPage title={c.title} lead={c.lead} updated={UPDATED[language] ?? UPDATED.en} blocks={blocks} />
}
