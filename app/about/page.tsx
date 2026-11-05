"use client"

import { H2, MarketingShell } from "@/components/marketing-shell"
import { useLanguage } from "@/lib/language-context"

const C = {
  en: {
    title: "About TBRAC",
    lead: "TBRAC (Trans-Border Risk Assessment and Certification) gives US decision-makers a documented, independent view of companies with Chinese ownership or ties, and gives those companies a fair way to show where they stand.",
    whatTitle: "What we do",
    what: [
      "We assess companies under a published methodology and issue a rating that is a private certification as of its date: red lines first, then 29 indicators across seven risk domains, each finding graded by the strength of its evidence and decided by a committee.",
      "Before that, any company can take a free, private self-assessment to see where a comprehensive assessment is likely to focus.",
      "A TBRAC report is not legal advice, not a government certification or approval and not a CFIUS determination. The people who rely on it make their own decisions.",
    ],
    whyTitle: "Why we exist",
    why: "Counties, state agencies and business partners are increasingly asked to decide on investments, land, incentives and contracts involving companies with Chinese ownership or ties. State laws differ and change, federal review does not cover every local transaction, and questionnaires answered by the company cannot be verified. TBRAC was built to give those decisions a documented basis, and to give companies a consistent, fair process instead of guesswork.",
    milestonesTitle: "Milestones",
    milestones: [
      ["January 2024", "Concept and framework direction developed."],
      ["June 2024", "Assurance Pacific Assessments LLC formed."],
      ["June 2025", "Published Trans-Border Risk Assessment and Certification for Chinese Companies Exploring US Market Entry."],
      ["March 2026", "Website launched and first client assessments initiated."],
    ],
    teamTitle: "Founding team",
    background: "Background",
    team: [
      ["Yanyu Zhang", "Co-Founder · Methodology Lead", "Leads the development of TBRAC's core methodology and assessment framework, including the cross-border risk architecture and evaluation model.",
        "Over a decade of experience building an education company in China, with experience in publishing and knowledge-system design."],
      ["Ken Chester", "Co-Founder · Market Entry Lead", "Leads market entry strategy and the application of risk frameworks to real-world commercial expansion.",
        "Serial entrepreneur with a background in technology, investment, and U.S.-China commercial relations. Regional NSF Innovation Corps grant recipient."],
      ["Ashwin Dhanasamy", "Co-Founder · Platform Engineering Lead", "Leads the technical architecture and engineering development, transforming the TBRAC framework into a functional digital system.",
        "Experienced machine learning and AI engineer focused on developing decentralized protocols and autonomous agent infrastructure for global commerce."],
    ],
    entity: "TBRAC is operated by Assurance Pacific Assessments LLC, a Michigan limited liability company based in California.",
  },
  zh: {
    title: "关于 TBRAC",
    lead: "TBRAC（跨境风险评估与认证）为美国决策者提供有关具有中国所有权或关联企业的、有据可查的独立评估，并为这些企业提供展示自身状况的公平途径。",
    whatTitle: "我们做什么",
    what: [
      "我们依据公开的评估方法对企业进行评估，并出具评级，该评级为截至出具日期的私营机构认证：首先检查红线，然后对七个风险领域的 29 项指标评分，每项调查结果依据证据强度分级，并由委员会作出决定。",
      "在此之前，任何企业都可以先进行免费、保密的自我评估，了解全面评估可能关注的重点。",
      "TBRAC 报告不构成法律意见，不是政府认证或批准，也不是 CFIUS 决定。依赖报告的各方自行作出决定。",
    ],
    whyTitle: "我们为何存在",
    why: "县政府、州机构和商业伙伴越来越多地需要就涉及中国所有权或关联企业的投资、土地、激励和合同作出决定。各州法律不同且不断变化，联邦审查并不涵盖所有地方交易，而企业自行填写的问卷又无法核实。TBRAC 的建立，是为了让这些决定有据可查，也让企业获得一致、公平的流程，而不是凭猜测行事。",
    milestonesTitle: "发展历程",
    milestones: [
      ["2024 年 1 月", "形成概念和框架方向。"],
      ["2024 年 6 月", "成立 Assurance Pacific Assessments LLC。"],
      ["2025 年 6 月", "发布《面向探索美国市场的中国企业的跨境风险评估与认证》。"],
      ["2026 年 3 月", "网站上线，首批客户评估启动。"],
    ],
    teamTitle: "创始团队",
    background: "背景",
    team: [
      ["Yanyu Zhang", "联合创始人 · 评估方法负责人", "负责 TBRAC 核心评估方法和评估框架的开发，包括跨境风险架构和评估模型。",
        "在中国创办教育企业十余年，具有出版和知识体系设计经验。"],
      ["Ken Chester", "联合创始人 · 市场进入负责人", "负责市场进入战略，以及风险框架在实际商业扩张中的应用。",
        "连续创业者，拥有科技、投资和中美商业关系背景。美国国家科学基金会（NSF）区域创新团队（I-Corps）资助获得者。"],
      ["Ashwin Dhanasamy", "联合创始人 · 平台工程负责人", "负责技术架构和工程开发，将 TBRAC 框架转化为可运行的数字系统。",
        "经验丰富的机器学习和 AI 工程师，专注于为全球商业开发去中心化协议和自主代理基础设施。"],
    ],
    entity: "TBRAC 由 Assurance Pacific Assessments LLC 运营，该公司为在密歇根州注册、总部位于加利福尼亚州的有限责任公司。",
  },
}

export default function AboutPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  return (
    <MarketingShell title={c.title} lead={c.lead}>
      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <H2>{c.whatTitle}</H2>
          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-700">{c.what.map((x) => <p key={x}>{x}</p>)}</div>
        </div>
        <div>
          <H2>{c.whyTitle}</H2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-700">{c.why}</p>
        </div>
      </section>

      <section>
        <H2>{c.milestonesTitle}</H2>
        <ol className="mt-6 space-y-4 border-l-2 border-slate-200 pl-6">
          {c.milestones.map(([d, e]) => (
            <li key={d}><p className="text-sm font-semibold text-slate-900">{d}</p><p className="text-[15px] text-slate-600">{e}</p></li>
          ))}
        </ol>
      </section>

      <section>
        <H2>{c.teamTitle}</H2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {c.team.map(([name, role, does, bg]) => (
            <div key={name} className="border-t-2 border-slate-900 pt-4">
              <h3 className="font-semibold text-slate-900">{name}</h3>
              <p className="text-sm text-sky-800">{role}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{does}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500"><span className="font-medium text-slate-600">{c.background}: </span>{bg}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-slate-500">{c.entity}</p>
    </MarketingShell>
  )
}
