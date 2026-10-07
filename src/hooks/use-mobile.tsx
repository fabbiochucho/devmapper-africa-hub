import * as React from "react"

// Narrow screens, phones turned to landscape (wide but short, touch) and touch tablets in portrait
// get the mobile layout: the sidebar becomes a slide-out sheet instead of taking a third of the
// screen. Touch tablets in landscape (>= 1024px) and all mouse/trackpad screens keep the sidebar.
const MOBILE_QUERY =
  "(max-width: 767px), (max-height: 500px) and (pointer: coarse), (max-width: 1023px) and (pointer: coarse)"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
