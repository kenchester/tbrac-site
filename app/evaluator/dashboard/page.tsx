import { redirect } from "next/navigation"

// The old self-assessment review screen showed sample data. Self-assessments are private to each
// company (privacy policy), so evaluators start from comprehensive assessments and the requests panel.
export default function EvaluatorDashboard() {
  redirect("/evaluator/engagements")
}
