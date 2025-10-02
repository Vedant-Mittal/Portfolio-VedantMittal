import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://www.tradeark.in";

export function CanonicalUpdater(): null {
  const location = useLocation();

  useEffect(() => {
    const fullUrl = SITE_ORIGIN + location.pathname + (location.search || "");
    let linkEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.setAttribute("rel", "canonical");
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute("href", fullUrl);
  }, [location.pathname, location.search]);

  return null;
}

export default CanonicalUpdater;


