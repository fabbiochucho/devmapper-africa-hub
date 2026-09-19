import { useEffect } from "react";

// Hydrates local form state from an async source (e.g. a profile that loads
// after mount) once it arrives, and again whenever the source's identity
// changes.
export function useHydrateFormFromSource<T>(
  source: T | null | undefined,
  hydrate: (source: T) => void
) {
  useEffect(() => {
    if (!source) return;
    hydrate(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);
}
