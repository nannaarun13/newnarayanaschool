import { collection, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define constants for consistency and reuse
export const SECURITY_EVENT_TYPES = [
  'login_attempt', 
  'admin_registration', 
  'permission_denied', 
  'rate_limit_exceeded', 
  'suspicious_activity'
] as const;

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export interface SecurityEvent {
  id?: string;
  type: typeof SECURITY_EVENT_TYPES[number];
  severity: typeof SEVERITY_LEVELS[number];
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  timestamp: string;
  resolved: boolean;
}

// Enhanced input sanitization for security logs
const sanitizeLogInput = (input: any, maxLength: number = 2000): string => {
  if (!input || typeof input !== 'string') return 'unknown';
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, maxLength);
};

// Log security events with enhanced validation
export const logSecurityEvent = async (event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> => {
  try {
    // Validate event type and severity using the constants
    if (!SECURITY_EVENT_TYPES.includes(event.type as any)) {
      console.error('Invalid security event type:', event.type);
      return;
    }
    
    if (!SEVERITY_LEVELS.includes(event.severity as any)) {
      console.error('Invalid security event severity:', event.severity);
      return;
    }

    const securityEvent: SecurityEvent = {
      type: event.type,
      severity: event.severity,
      email: event.email ? sanitizeLogInput(event.email, 100) : undefined,
      ipAddress: event.ipAddress ? sanitizeLogInput(event.ipAddress, 50) : undefined,
      userAgent: event.userAgent ? sanitizeLogInput(event.userAgent, 500) : undefined,
      details: sanitizeLogInput(event.details, 2000), // Increased limit for stack traces/logs
      timestamp: new Date().toISOString(),
      resolved: false
    };

    await addDoc(collection(db, 'security_events'), securityEvent);
    console.log(`Security event logged: ${event.type} (${event.severity})`);
  } catch (error) {
    console.error('Error logging security event:', error);
    // Fail silently to prevent interrupting the main app flow
  }
};

// Get recent security events with filtering
export const getSecurityEvents = async (
  limitCount: number = 50,
  severity?: string,
  type?: string
): Promise<SecurityEvent[]> => {
  try {
    const sanitizedLimit = Math.min(Math.max(1, Number(limitCount) || 50), 100);
    
    // Start with the base collection
    let constraints: any[] = [];

    // Apply Filters FIRST (