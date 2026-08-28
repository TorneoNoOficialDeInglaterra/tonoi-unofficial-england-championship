import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = "G-D0VL0VT38Z";

/**
 * Sends a GA4 page_view on every client-side route change.
 * The initial page view is sent by the gtag snippet in index.html.
 */
export default function Analytics() {
  const location = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
      send_to: MEASUREMENT_ID,
    });
  }, [location.pathname, location.search]);

  return null;
}
