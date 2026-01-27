import { useEffect } from 'react';

const SecurityHeaders = () => {
  useEffect(() => {
    /**
     * Add or update a meta tag by name
     */
    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    /**
     * Add or update a meta tag by http-equiv
     * NOTE: Only CSP is respected here by modern browsers
     */
    const setHttpEquiv = (httpEquiv: string, content: string) => {
      let meta = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('http-equiv', httpEquiv);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    /* --------------------------------------------------
       Content Security Policy (SAFE for Firebase + React)
       -------------------------------------------------- */
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' https://www.gstatic.com https://www.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
      "frame-src https://*.firebaseapp.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');

    setHttpEquiv('Content-Security-Policy', contentSecurityPolicy);

    /* --------------------------------------------------
       Legit meta tags (SEO + UX safe)
       -------------------------------------------------- */
    setMeta('format-detection', 'telephone=no');
    setMeta('referrer', 'strict-origin-when-cross-origin');

  }, []);

  return null;
};

export default SecurityHeaders;
