// src/components/security/SecurityHeadersEnhanced.tsx

import { useEffect } from "react";

/**
 * IMPORTANT:
 * This component ONLY adds browser-supported META tags.
 * ALL real security headers (CSP, X-Frame, HSTS, COOP, COEP)
 * MUST be configured in Netlify headers.
 */
const SecurityHeadersEnhanced = () => {
  useEffect(() => {
    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement | null;

      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }

      meta.content = content;
    };

    // ✅ SAFE, browser-respected meta tags
    setMeta("referrer", "strict-origin-when-cross-origin");
    setMeta("format-detection", "telephone=no");
    setMeta("theme-color", "#1e40af");

    /**
     * ❌ DO NOT SET THESE IN REACT:
     * - Content-Security-Policy
     * - X-Frame-Options
     * - Strict-Transport-Security
     * - Permissions-Policy
     * - COOP / COEP / CORP
     *
     * Browsers IGNORE them or they BREAK features (maps, Firebase).
     */

  }, []);

  return null;
};

export default SecurityHeadersEnhanced;
