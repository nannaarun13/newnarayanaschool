import DOMPurify from 'dompurify';

export interface SanitizationOptions {
  allowHTML?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  stripTags?: boolean;
  preventXSS?: boolean;
}

// Enhanced input sanitization with comprehensive XSS protection
export const sanitizeInput = (
  input: unknown, 
  options: SanitizationOptions = {}
): string => {
  const {
    allowHTML = false,
    maxLength = 1000,
    allowedTags = [],
    stripTags = true,
    preventXSS = true
  } = options;

  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Enhanced XSS prevention patterns
  if (preventXSS) {
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/expression\s*\(/gi, '') // Remove CSS expressions
      .replace(/url\s*\(/gi, '') // Remove CSS url() calls
      .replace(/import\s+/gi, '') // Remove import statements
      .replace(/@import/gi, '') // Remove CSS @import
      .replace(/eval\s*\(/gi, '') // Remove eval calls
      .replace(/Function\s*\(/gi, '') // Remove Function constructor
      .replace(/setTimeout\s*\(/gi, '') // Remove setTimeout
      .replace(/setInterval\s*\(/gi, ''); // Remove setInterval
  }

  if (allowHTML) {
    // SSR Check: DOMPurify needs a window context in some setups, but modern bundlers handle it.
    // We wrap it just in case.
    if (typeof window !== 'undefined') {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: allowedTags.length > 0 ? allowedTags : ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: ['class', 'id'],
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe', 'link', 'style'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        ALLOW_DATA_ATTR: false,
        SANITIZE_DOM: true,
        KEEP_CONTENT: false
      });
    }
  } else if (stripTags) {
    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // FIX: SSR-Safe HTML Entity Decoding
    // We only use the DOM method if we are in