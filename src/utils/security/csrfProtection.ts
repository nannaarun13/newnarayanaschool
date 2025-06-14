
import { validateCSRFToken, validateOrigin } from './inputSanitization';

class CSRFProtection {
  private static instance: CSRFProtection;
  private token: string | null = null;
  private readonly TOKEN_KEY = '__csrf_token__';
  private readonly ALLOWED_ORIGINS = [
    window.location.origin,
    'https://localhost:3000',
    'https://127.0.0.1:3000'
  ];

  private constructor() {
    this.initializeToken();
    this.setupOriginValidation();
  }

  public static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private initializeToken(): void {
    try {
      const storedToken = sessionStorage.getItem(this.TOKEN_KEY);
      if (storedToken && this.isValidToken(storedToken)) {
        this.token = storedToken;
      } else {
        this.refreshToken();
      }
    } catch (error) {
      console.error('CSRF token initialization failed:', error);
      this.refreshToken();
    }
  }

  private setupOriginValidation(): void {
    // Add current origin if not already present
    const currentOrigin = window.location.origin;
    if (!this.ALLOWED_ORIGINS.includes(currentOrigin)) {
      this.ALLOWED_ORIGINS.push(currentOrigin);
    }
  }

  private isValidToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    // Enhanced token validation
    const validLength = token.length === 64;
    const validFormat = /^[a-f0-9]+$/.test(token);
    const notExpired = this.isTokenNotExpired(token);
    
    return validLength && validFormat && notExpired;
  }

  private isTokenNotExpired(token: string): boolean {
    try {
      const tokenTimestamp = sessionStorage.getItem(`${this.TOKEN_KEY}_timestamp`);
      if (!tokenTimestamp) return false;
      
      const tokenTime = parseInt(tokenTimestamp, 10);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      return (now - tokenTime) < maxAge;
    } catch {
      return false;
    }
  }

  public getToken(): string {
    if (!this.token || !this.isValidToken(this.token)) {
      this.refreshToken();
    }
    return this.token!;
  }

  public refreshToken(): void {
    this.token = this.generateToken();
    try {
      sessionStorage.setItem(this.TOKEN_KEY, this.token);
      sessionStorage.setItem(`${this.TOKEN_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('Failed to store CSRF token:', error);
    }
  }

  public validateToken(providedToken: string): boolean {
    if (!this.token) {
      return false;
    }
    return validateCSRFToken(providedToken, this.token);
  }

  public validateOrigin(origin?: string): boolean {
    const requestOrigin = origin || document.referrer || window.location.origin;
    return validateOrigin(requestOrigin, this.ALLOWED_ORIGINS);
  }

  public getHeaders(): Record<string, string> {
    return {
      'X-CSRF-Token': this.getToken(),
      'X-Requested-With': 'XMLHttpRequest',
      'X-Origin': window.location.origin
    };
  }

  public validateRequest(providedToken?: string, origin?: string): boolean {
    const tokenValid = providedToken ? this.validateToken(providedToken) : false;
    const originValid = this.validateOrigin(origin);
    
    if (!tokenValid) {
      console.warn('CSRF token validation failed');
    }
    
    if (!originValid) {
      console.warn('Origin validation failed:', origin);
    }
    
    return tokenValid && originValid;
  }
}

export const csrfProtection = CSRFProtection.getInstance();

// Enhanced admin operation validation with origin checking
export const validateAdminOperation = (providedToken?: string, origin?: string): boolean => {
  if (!providedToken) {
    console.warn('CSRF token missing for admin operation');
    return false;
  }
  
  const isValid = csrfProtection.validateRequest(providedToken, origin);
  if (!isValid) {
    console.warn('Security validation failed for admin operation');
  }
  
  return isValid;
};

// Enhanced middleware with comprehensive protection
export const withCSRFProtection = (operation: Function) => {
  return (...args: any[]) => {
    const token = csrfProtection.getToken();
    const origin = window.location.origin;
    
    if (!token) {
      throw new Error('CSRF protection not available');
    }
    
    if (!csrfProtection.validateOrigin()) {
      throw new Error('Invalid request origin');
    }
    
    return operation(...args, { 
      csrfToken: token,
      origin: origin,
      timestamp: Date.now()
    });
  };
};

// Form protection helper
export const protectForm = (formElement: HTMLFormElement): void => {
  if (!formElement) return;
  
  // Add CSRF token as hidden input
  const existingToken = formElement.querySelector('input[name="csrf_token"]') as HTMLInputElement;
  if (existingToken) {
    existingToken.value = csrfProtection.getToken();
  } else {
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'csrf_token';
    tokenInput.value = csrfProtection.getToken();
    formElement.appendChild(tokenInput);
  }
  
  // Add origin validation
  formElement.addEventListener('submit', (event) => {
    if (!csrfProtection.validateOrigin()) {
      event.preventDefault();
      console.error('Form submission blocked: invalid origin');
      alert('Security error: Invalid request origin');
    }
  });
};

// Auto-protect all forms on page load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form') as NodeListOf<HTMLFormElement>;
    forms.forEach(protectForm);
  });
}
