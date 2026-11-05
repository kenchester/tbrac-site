"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen kind="error" retry={reset} />;
}
