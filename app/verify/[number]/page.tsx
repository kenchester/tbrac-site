import { VerifyResult } from "@/components/verify-view";

export const metadata = { title: "Report verification · TBRAC" };

export default async function VerifyNumberPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <VerifyResult number={decodeURIComponent(number).toUpperCase()} />;
}
