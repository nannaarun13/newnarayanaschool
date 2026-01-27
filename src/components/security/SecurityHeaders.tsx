import { useEffect } from 'react';

const SecurityHeaders = () => {
  useEffect(() => {
    // Add security-related meta tags dynamically
    const addMetaTag = (name: string, content: string) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    const addHttpEquivTag = (httpEquiv: string, content: string) => {
      const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', httpEquiv);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Security headers
    addHttpEquivTag('X-Content-Type-Options', 'nosniff');
    addHttpEquivTag('X-Frame-Options', 'DENY');
    addHttpEquivTag('X-XSS-Protection', '1; mode=block');
    addHttpEquivTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy (basic for client-side app)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com",
      "frame-src 'self' https://*.firebaseapp.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
    
    addHttpEquivTag('Content-Security-Policy', csp);
    
    // Additional security meta tags
    // ✅ FIX: "noindex" line removed. 
    // You can explicitly add "index, follow" if you want, but it is not required (default is index).
    addMetaTag('robots', 'index, follow'); 
    addMetaTag('format-detection', 'telephone=no');
    
  }, []);

  return null; // This component only adds meta tags
};

export default SecurityHeaders;
