"use client"

import { H2, MarketingShell } from "@/components/marketing-shell"
import { useLanguage } from "@/lib/language-context"

type Case = { who: string; title: string; situation: string; examines: string[]; receives: string; outcomes: string }

const C: Record<"en" | "zh", { title: string; lead: string; label: string; ex: string; rec: string; out: string; note: string; cases: Case[] }> = {
  en: {
    title: "Use cases",
    lead: "How a TBRAC assessment fits the decisions US public bodies and partners face. These are illustrative scenarios with fictional companies, not client results.",
    label: "Illustrative scenario · fictional", ex: "What TBRAC examines", rec: "What the relying party receives", out: "How the result could differ",
    note: "TBRAC does not publish client results. Ratings follow the evidence in each case; a scenario here does not predict any rating.",
    cases: [
      { who: "County economic development corporation", title: "A tax abatement for a battery-materials plant",
        situation: "A cathode-materials maker with a Chinese parent asks a county for a property-tax abatement for a 400-job plant. A minority investor in the parent is a provincial guidance fund.",
        examines: ["The ownership chain to the ultimate owners, including the guidance fund's stake and rights", "Screening of every entity and owner against US lists", "Whether the company meets the definitions in the state's foreign-ownership statute", "Supply-chain exposure to forced-labor risk"],
        receives: "The rating with its evidence, a Statutory Eligibility page for the state law, and agreement conditions such as change-of-control notice and a clawback the county can write into the abatement agreement. The rating is monitored for 12 months.",
        outcomes: "A small, passive stake with documented limits on control could support a moderate rating with conditions. A listed entity in the chain is a red line that sets a high rating regardless of the other findings." },
      { who: "State agency", title: "Farmland near a military installation",
        situation: "A food processor with Chinese ownership plans to buy farmland within a few miles of a military installation, in a state that restricts such purchases.",
        examines: ["The purchaser's ownership and control, and any state, Party or military links", "The site's proximity to sensitive facilities and the planned use", "Whether the purchaser falls within the statute's definitions, test by test, on counsel's opinion"],
        receives: "A Statutory Eligibility page that states, separately from the rating, whether each statutory test is met, with the legal basis relied on.",
        outcomes: "Where the statute bars the purchase, no rating changes that. Where it does not apply, the rating and conditions still inform the agency's own decision." },
      { who: "Landlord or lender", title: "A software company handling US customer data",
        situation: "A software firm with engineering teams in China leases office space and seeks a credit line to serve US enterprise customers.",
        examines: ["Where US customer data is stored and who can access it from abroad", "Data-security controls, and how they are evidenced", "Financial integrity, audit quality and related-party transactions"],
        receives: "A documented view of data-access risk and governance, with the evidence behind each finding and the company's own reply to the draft findings.",
        outcomes: "Data held in the US with access controls that are tested and documented supports a better data-security finding than a stated policy without evidence." },
      { who: "The company itself", title: "A re-evaluation after restructuring",
        situation: "A company rated Elevated removes a state-linked shareholder, moves US data to a separate US subsidiary and replaces flagged suppliers.",
        examines: ["Fresh evidence for each changed area, with the same screening, review and committee as a first assessment"],
        receives: "A new report that replaces the earlier one in the public register. Everyone following the old report is told it was replaced.",
        outcomes: "The new rating depends on what the new evidence shows; improvements that are not documented do not change it." },
    ],
  },
  zh: {
    title: "应用场景",
    lead: "TBRAC 评估如何服务于美国公共机构和合作伙伴面临的决定。以下为使用虚构企业的示意场景，并非客户结果。",
    label: "示意场景 · 虚构", ex: "TBRAC 审查什么", rec: "依赖方收到什么", out: "结果可能如何不同",
    note: "TBRAC 不公开客户结果。每项评级均以证据为依据；此处的场景不预示任何评级。",
    cases: [
      { who: "县经济发展机构", title: "电池材料工厂的税收减免",
        situation: "一家拥有中国母公司的正极材料企业，为一座 400 个岗位的工厂向县政府申请房产税减免。母公司的一名少数股东为省级政府引导基金。",
        examines: ["直至最终所有人的所有权链，包括引导基金的持股和权利", "按美国名单筛查每个实体和所有人", "企业是否符合该州外国所有权法律的定义", "供应链中的强迫劳动风险"],
        receives: "附证据的评级、针对该州法律的法定资格页面，以及可写入减免协议的协议条件，例如控制权变更通知和追回条款。评级在 12 个月内持续监测。",
        outcomes: "小额、被动且对控制权有书面限制的持股，可能支持附条件的中等评级。所有权链中如有列名实体，则构成红线，无论其他调查结果如何，均设定为高风险评级。" },
      { who: "州政府机构", title: "军事设施附近的农地",
        situation: "一家具有中国所有权的食品加工企业，计划在限制此类购买的州内，购买距某军事设施数英里的农地。",
        examines: ["购买方的所有权和控制权，以及与国家、党或军方的任何关联", "地块与敏感设施的距离及计划用途", "依据律师意见，逐项判断购买方是否属于法律定义的范围"],
        receives: "法定资格页面，独立于评级，逐项说明是否满足各项法定标准，并列明所依据的法律依据。",
        outcomes: "如法律禁止该购买，任何评级都不会改变这一结果。如法律不适用，评级和条件仍可为机构自行决策提供参考。" },
      { who: "房东或贷款方", title: "处理美国客户数据的软件企业",
        situation: "一家在中国设有工程团队的软件企业租用办公场所，并为服务美国企业客户申请授信额度。",
        examines: ["美国客户数据的存储位置以及境外人员的访问权限", "数据安全控制措施及其证明", "财务诚信、审计质量和关联交易"],
        receives: "关于数据访问风险和治理的书面评估，附每项调查结果背后的证据，以及企业对调查结果草稿的回复。",
        outcomes: "数据存储于美国、访问控制经过测试并有记录，比仅有书面政策而无证据，更能支持较好的数据安全结论。" },
      { who: "企业本身", title: "重组后的重新评估",
        situation: "一家被评为“较高”风险的企业，移除了与国家有关联的股东，将美国数据迁至独立的美国子公司，并更换了被标记的供应商。",
        examines: ["对每个变化领域提供新证据，并经过与首次评估相同的筛查、复核和委员会决定"],
        receives: "一份在公开登记册中取代原报告的新报告。所有关注原报告的人都会收到报告已被取代的通知。",
        outcomes: "新评级取决于新证据所显示的情况；未经证明的改进不会改变评级。" },
    ],
  },
}

export default function UseCasesPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  return (
    <MarketingShell title={c.title} lead={c.lead}>
      {c.cases.map((x) => (
        <section key={x.title} className="space-y-4 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">{x.who} · <span className="italic">{c.label}</span></p>
          <H2>{x.title}</H2>
          <p className="text-[15px] leading-relaxed text-slate-700">{x.situation}</p>
          <div className="grid gap-6 md:grid-cols-3">
            <div><h3 className="font-semibold text-slate-900">{c.ex}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-slate-600">{x.examines.map((e) => <li key={e}>{e}</li>)}</ul></div>
            <div><h3 className="font-semibold text-slate-900">{c.rec}</h3><p className="mt-2 text-[15px] leading-relaxed text-slate-600">{x.receives}</p></div>
            <div><h3 className="font-semibold text-slate-900">{c.out}</h3><p className="mt-2 text-[15px] leading-relaxed text-slate-600">{x.outcomes}</p></div>
          </div>
        </section>
      ))}
      <p className="text-sm text-slate-500">{c.note}</p>
    </MarketingShell>
  )
}
