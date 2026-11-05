"use client"

import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MarketingShell } from "@/components/marketing-shell"
import { useLanguage } from "@/lib/language-context"

const C = {
  en: {
    title: "Common questions",
    lead: "About the free self-assessment, the comprehensive assessment and what a TBRAC certification means.",
    more: "Another question?", contact: "Contact us",
    qa: [
      ["What is TBRAC?", "TBRAC (Trans-Border Risk Assessment and Certification) assesses companies with Chinese ownership or ties that plan US investments, sites or partnerships, and reports the result to the counties, state agencies and partners who rely on it. It is operated by Assurance Pacific Assessments LLC."],
      ["What is the difference between the self-assessment and the comprehensive assessment?", "The free self-assessment is 10 modules your company answers itself. It is private, not verified, and gives an indicative score and the red flags to fix first. The comprehensive assessment is carried out by TBRAC: documents are verified, the ownership chain is screened against US lists, findings are graded by their evidence, and a committee with an independent chair decides a rating that TBRAC certifies."],
      ["Is a TBRAC report a certification?", "Yes, a private one. A TBRAC report is a private certification issued by Assurance Pacific Assessments LLC under its published methodology, as of the date stated. It is not a government certification, approval or license, not a CFIUS determination and not a guarantee of the company's future conduct."],
      ["Who uses TBRAC reports?", "Counties, economic development agencies, state agencies, landlords, lenders and business partners who need a documented view of a company's ownership, links and controls before an incentive, land sale, lease or contract. The company itself uses the self-assessment to prepare."],
      ["How long does it take?", "The self-assessment usually takes under an hour and can be done in several sittings. The timing of a comprehensive assessment depends mainly on how quickly the company answers TBRAC's document requests; the timetable is set out in the engagement letter."],
      ["How is the self-assessment scored?", "Each module has 10 questions answered on a 0–10 scale (0 = highest risk). The results are combined into an indicative risk score from 0 to 100, where a higher score means higher risk, and an indicative tier. Certain answers are red flags that set a minimum tier on their own."],
      ["How is the comprehensive rating decided?", "Red lines are checked first. Then 29 indicators in seven domains (ownership and state links, national security and export control, data security, supply chain, integrity, finances, IP) are scored, each graded by the strength of its evidence, and weighted as set out in the published methodology. The result is a tier from T1 (low identified risk) to T4 (high), with a confidence level and an outlook. A second reviewer checks the work and a committee decides."],
      ["What does it cost?", "One flat fee per assessment type, the same for every company whatever its size, paid before the committee meets and never linked to the result. The fees are listed on the page for companies."],
      ["Who sees my company's information?", "Your self-assessment is private to your company. In a comprehensive assessment, the TBRAC team and committee working on it see your documents, every evaluator access is logged, and the restricted report goes only to named relying parties who accept TBRAC's reliance terms. The privacy policy explains what is kept and for how long."],
      ["How do I check that a report is genuine and current?", "Enter its report number at tbrac.org/verify. You will see its live status, the fingerprint of the rating, and whether TBRAC's digital signature checks. You can also ask to be emailed whenever its status changes."],
      ["Can a rating change?", "Yes. A rating is valid for 12 months and is monitored. A new listing, an ownership change or other trigger can place it Under Review; it can then be affirmed, re-rated or withdrawn. A company that improves its position can ask for a re-evaluation on new evidence, which replaces the earlier report when issued."],
      ["Which languages are supported?", "The site, the self-assessment, emails and reports are available in English and Simplified Chinese. Documents in Chinese are accepted."],
    ],
  },
  zh: {
    title: "常见问题",
    lead: "关于免费自我评估、全面评估以及 TBRAC 认证的含义。",
    more: "还有其他问题？", contact: "联系我们",
    qa: [
      ["什么是 TBRAC？", "TBRAC（跨境风险评估与认证）对计划在美国投资、设厂或合作、具有中国所有权或关联的企业进行评估，并将结果报告给依赖该结果的县政府、州机构和合作伙伴。TBRAC 由 Assurance Pacific Assessments LLC 运营。"],
      ["自我评估与全面评估有何区别？", "免费自我评估共 10 个模块，由贵公司自行作答，仅贵公司可见，未经核实，提供参考评分和需要优先处理的风险信号。全面评估由 TBRAC 开展：核实文件，按美国名单筛查所有权链，依据证据强度对调查结果分级，并由设独立主席的委员会决定评级，由 TBRAC 予以认证。"],
      ["TBRAC 报告是认证吗？", "是的，是私营机构认证。TBRAC 报告是 Assurance Pacific Assessments LLC 依据其公开的评估方法、截至所述日期出具的私营机构认证。它不是政府认证、批准或许可，不是 CFIUS 决定，也不保证企业未来的行为。"],
      ["谁会使用 TBRAC 报告？", "县政府、经济发展机构、州机构、房东、贷款方和商业伙伴，在作出激励、土地出售、租赁或合同决定前，需要对企业的所有权、关联关系和内部控制有书面依据。企业本身则使用自我评估进行准备。"],
      ["需要多长时间？", "自我评估通常不到一小时即可完成，并可分多次作答。全面评估的时间主要取决于企业回复 TBRAC 文件请求的速度；具体时间安排在委托书中约定。"],
      ["自我评估如何计分？", "每个模块有 10 个问题，按 0–10 分作答（0 = 风险最高）。结果合并为 0 至 100 的参考风险评分，分数越高表示风险越大，并给出参考等级。某些回答属于风险信号，会直接设定最低等级。"],
      ["全面评估的评级如何决定？", "首先检查红线，然后对七个领域（所有权与国家关联、国家安全与出口管制、数据安全、供应链、诚信、财务、知识产权）的 29 项指标评分，每项依据证据强度分级，并按公开评估方法中的权重加权。结果为 T1（已识别风险低）至 T4（高）的评级，并附可信度和展望。第二审核人复核，由委员会作出决定。"],
      ["费用是多少？", "每类评估一个固定费用，无论企业规模大小均相同，在委员会开会前支付，且绝不与结果挂钩。费用列于企业指南页面。"],
      ["谁可以看到我公司的信息？", "自我评估仅贵公司可见。在全面评估中，参与评估的 TBRAC 团队和委员会可查看贵公司文件，评估人员的每次访问均被记录；限制分发报告仅提供给接受 TBRAC 依赖条款的指定依赖方。保存内容和期限见隐私政策。"],
      ["如何确认报告真实且仍然有效？", "在 tbrac.org/verify 输入报告编号，即可看到实时状态、评级的数字指纹以及 TBRAC 数字签名是否核验一致。您也可以选择在状态变更时接收电子邮件提醒。"],
      ["评级会变化吗？", "会。评级有效期为 12 个月并受到持续监测。新的列名、所有权变更或其他触发事件可使评级进入“审查中”，之后可能获得确认、重新评级或被撤回。企业情况改善后，可依据新证据申请重新评估，新报告出具后将取代原报告。"],
      ["支持哪些语言？", "网站、自我评估、邮件和报告均提供英文和简体中文版本，并接受中文文件。"],
    ],
  },
}

export default function FAQPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  return (
    <MarketingShell title={c.title} lead={c.lead}>
      <Accordion type="single" collapsible className="w-full">
        {c.qa.map(([q, a], i) => (
          <AccordionItem key={q} value={`q${i}`}>
            <AccordionTrigger className="text-left text-base font-semibold">{q}</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-relaxed text-slate-700">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-slate-600">{c.more} <Link href="/contact" className="font-semibold text-sky-800 hover:underline">{c.contact}</Link></p>
    </MarketingShell>
  )
}
