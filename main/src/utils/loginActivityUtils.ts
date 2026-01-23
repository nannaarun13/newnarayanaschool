import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface LoginActivity {
  adminId?: string; // Optional because failed logins might not have a known ID
  email: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

// Helper to fetch real IP address
const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (e) {
    // Fail silently and return fallback
  }
  return 'unknown';
};

// Enhanced input sanitization
const sanitizeString = (input: any, maxLength: number = 500): string => {
  if (!input || typeof input !== 'string') return 'unknown';
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&`]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, maxLength);
};

const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  const cleaned = email.toLowerCase().trim();
  
  // Strict email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned) || cleaned.length > 100 || cleaned.length < 5) {
    return '';
  }
  return cleaned;
};

// Get client info including IP
const getSecureClientInfo = async () => {
  try {
    const userAgent = navigator.userAgent;
    const ipAddress = await getPublicIP();
    
    return {
      ipAddress: sanitizeString(ipAddress, 50),
      userAgent: sanitizeString(userAgent, 500)
    };
  } catch (error) {
    console.error('Error getting client info:', error);
    return {
      ipAddress: 'unknown',
      userAgent: 'unknown'
    };
  }
};

const isValidISODate = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') return false;
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoRegex.test(dateString) && !isNaN(new Date(dateString).getTime());
};

// --- LOGGING FUNCTIONS ---

export const logAdminLogin = async (adminId: string, email: string): Promise<void> => {
  try {
    if (!adminId || typeof adminId !== 'string') return;
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) return;

    // Verify authentication matches
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email?.toLowerCase() !== sanitizedEmail) {
      console.warn('Login logging skipped: User mismatch or unauthenticated');
      return;
    }

    const clientInfo = await getSecureClientInfo();
    const loginTime = new Date().toISOString();

    const loginActivity: LoginActivity = {
      adminId: sanitizeString(adminId, 100),
      email: sanitizedEmail,
      loginTime,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      status: 'success'
    };

    await addDoc(collection(db, 'admin_login_activities'), loginActivity);
    console.log('Admin login logged.');
  } catch (error) {
    console.error('Failed to log admin login:', error);
  }
};

export const logFailedAdminLogin = async (email: string, reason: string): Promise<void> => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedReason = sanitizeString(reason, 500);

    // We proceed even if email is invalid, just logging "unknown" to track the attempt
    const finalEmail = sanitizedEmail || 'invalid-email-format';

    const clientInfo = await getSecureClientInfo();
    const loginTime = new Date().toISOString();

    const loginActivity: LoginActivity = {
      email: finalEmail,
      loginTime,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      status: 'failed',
      failureReason: sanitizedReason
    };

    // ATTEMPT WRITE: This will succeed ONLY if your Firestore rules allow
    // "create" access for unauthenticated users