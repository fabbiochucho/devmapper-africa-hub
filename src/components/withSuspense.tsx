import React, { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

/**
 * Wraps a lazy-loaded component in its own Suspense boundary so that
 * navigation between routes does not unmount shared layout chrome.
 */
export function withSuspense(node: React.ReactNode): React.ReactElement {
  return <Suspense fallback={<PageSkeleton />}>{node}</Suspense>;
}

export default withSuspense;
