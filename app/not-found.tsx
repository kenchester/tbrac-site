import { ErrorScreen } from "@/components/error-screen";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <ErrorScreen kind="notFound" />;
}
