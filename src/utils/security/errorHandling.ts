// src/security/errorHandling.ts

export class SecurityError extends Error {
  public readonly name = 'SecurityError';
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly timestamp: string;
  public readonly context?: string;

  constructor(
    message: string, 
    code: string = 'SECURITY_ERROR',
    userMessage: string = 'A security error occurred. Please try again.',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: string
  ) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export class ValidationError extends SecurityError {
  constructor(message: string, field?: string, context?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      field ? `Invalid ${field}. Please check your input.` : 'Please check your input and try again.',
      'low',
      context
    );
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string = 'Authentication failed', context?: string) {
    super(
      message,
      'AUTH_ERROR',
      'Authentication failed. Please check your credentials.',
      'medium',
      context
    );
  }
}

export class RateLimitError extends SecurityError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, context?: string) {
    const userMsg = retryAfter 
      ? `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60000)} minutes.`
      : 'Too many attempts. Please try again later.';
      
    super(message, 'RATE_LIMIT_ERROR', userMsg, 'medium', context);
  }
}

export class CSRFError extends SecurityError {
  constructor(message: string = 'CSRF token validation failed', context?: string) {
    super(
      message,
      'CSRF_ERROR',
      'Security validation failed. Please refresh the page and try again.',
      'high',