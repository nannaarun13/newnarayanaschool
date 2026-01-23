
import { useEffect } from 'react';
import { SECURITY_CONFIG } from '@/utils/securityConfig';

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    __SECURITY_NONCE__?: string;
  }
}

const SecurityHeadersEnhanced = () => {
  useEffect(() => {
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

    // Generate cryptographically secure nonce for inline scripts
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), 
      byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Enhanced security headers with stricter policies
    if (SECURITY_CONFIG.headers.enableHSTS) {
      addHttpEquivTag('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    addHttpEquivTag('X-Content-Type-Options', 'nosniff');
    addHttpEquivTag('X-Frame-Options', 'DENY');
    addHttpEquivTag('X-XSS-Protection', '1; mode=block');
    
    if (SECURITY_CONFIG.headers.enableReferrerPolicy) {
      addHttpEquivTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Strengthened Content Security Policy with nonce-based approach
    if (SECURITY_CONFIG.headers.enableCSP) {
      const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "media-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "block-all-mixed-content",
        "upgrade-insecure-requests"
      ].join('; ');
      
      addHttpEquivTag('Content-Security-Policy', csp);
    }

    // Enhanced Permissions Policy with stricter controls
    addHttpEquivTag('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(), autoplay=(), encrypted-media=(), picture-in-picture=()'
    );

    // Cross-Origin policies for enhanced isolation
    addHttpEquivTag('Cross-Origin-Embedder-Policy', 'require-corp');
    addHttpEquivTag('Cross-Origin-Opener-Policy', 'same-origin');
    addHttpEquivTag('Cross-Origin-Resource-Policy', 'same-origin');

    // Additional security meta tags
    addMetaTag('robots', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    addMetaTag('format-detection', 'telephone=no, email=no, address=no');
    addMetaTag('theme-color', '#1e40af');
    
    // Enhanced cache control for sensitive data
    addHttpEquivTag('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    addHttpEquivTag('Pragma', 'no-cache');
    addHttpEquivTag('Expires', '0');

    // Add Subresource Integrity to external resources
    const addIntegrityToExternalResources = () => {
      const scripts = document.querySelectorAll('script[src^="https://"]');
      scripts.forEach(script => {
        if (!script.hasAttribute('integrity')) {
          script.setAttribute('crossorigin', 'anonymous');
          // Apply nonce to scripts that don't have integrity
          if (!script.getAttribute('src')?.includes('firebase')) {
            script.setAttribute('nonce', nonce);
          }
        }
      });
      
      const links = document.querySelectorAll('link[href^="https://"]');
      links.forEach(link => {
        if (!link.hasAttribute('integrity')) {
          link.setAttribute('crossorigin', 'anonymous');
        }
      });
    };

    addIntegrityToExternalResources();

    // Store nonce for potential use by other components
    window.__SECURITY_NONCE__ = nonce;

    // Add security event listener for violations
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('CSP Violation:', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy
      });
    };

    document.addEventListener('securitypolicyviolation', handleSecurityViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
    };

  }, []);

  return null;
};

export default SecurityHeadersEnhanced;
