import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { logAdminLogin, logFailedAdminLogin } from './loginActivityUtils';
import { ensureDefaultAdmin, DEFAULT_ADMIN } from './adminUtils';
import { persistentRateLimiter } from './persistentRateLimiter';
import { advancedSecurityMonitor } from './advancedSecurityMonitor';
import { sanitizeInput, sanitizeEmail } from './security/inputSanitization';
import { handleSecurityError, ValidationError, AuthenticationError, RateLimitError } from './security/errorHandling';
import * as z from "zod";

// --- VALIDATION SCHEMAS ---
export const loginSchema = z.object({
  email: z.string()
    .email({ message: "Invalid email address." })
    .max(100, { message: "Email too long." })
    .transform(email => sanitizeEmail(email)),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters." }) // Relaxed slightly for UX
    .max(100, { message: "Password too long." })
});

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email({ message: "Invalid email address." })
    .transform(email => sanitizeEmail(email)),
});

// --- LOGIN HANDLER ---
export const handleLogin = async (values: z.infer<typeof loginSchema>) => {
  console.log('Login attempt for:', values.email);
  
  try {
    const sanitizedEmail = values.email;
    // Strip dangerous tags but keep special chars for passwords
    const sanitizedPassword = values.password.trim(); 
    
    if (!sanitizedEmail || !sanitizedPassword) {
      throw new ValidationError('Invalid credentials provided');
    }
    
    // 1. Rate Limiting Check
    const emailLimitCheck = await persistentRateLimiter.isRateLimited(`email:${sanitizedEmail}`);
    if (emailLimitCheck.isLimited) {
      const reason = `Too many attempts. Try again in ${Math.ceil((emailLimitCheck.timeRemaining || 0) / 60000)} mins.`;
      await logFailedAdminLogin(sanitizedEmail, `Rate limited: ${emailLimitCheck.reason}`);
      throw new RateLimitError(reason, emailLimitCheck.timeRemaining);
    }

    // 2. Firebase Authentication
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
    } catch (authError: any) {
      await persistentRateLimiter.recordFailedAttempt(`email:${sanitizedEmail}`);
      
      const errorCode = authError.code;
      // Map Firebase errors to user-friendly messages
      switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          await logFailedAdminLogin(sanitizedEmail, 'Invalid credentials');
          throw new AuthenticationError('Invalid email or password');
        case 'auth/too-many-requests':
          await logFailedAdminLogin(sanitizedEmail, 'Firebase rate limited');
          throw new RateLimitError('Account temporarily locked due to failed attempts.');
        case 'auth/user-disabled':
          throw new AuthenticationError('This account has been disabled.');
        case 'auth/network-request-failed':
          throw new Error('Network error. Check your connection.');
        default:
          console.error("Firebase Auth Error:", errorCode);
          throw new AuthenticationError('Authentication failed. Please try again.');
      }
    }
    
    const user = userCredential.user;

    // 3. Special Handling for Super Admin
    // If this is the main admin, force-create their record if missing
    if (sanitizedEmail === DEFAULT_ADMIN.email.toLowerCase()) {
      await ensureDefaultAdmin(user.uid);
    }
    
    // 4. Check Firestore Admin Status
    let adminDoc = await getDoc(doc(db, 'admins', user.uid));
    
    // If not found by ID, check by Email (legacy support)
    if (!adminDoc.exists()) {
      const q = query(collection(db, 'admins'), where('email', '==', sanitizedEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await auth.signOut();
        throw new AuthenticationError('Account exists but no Admin Profile found. Please Register first.');
      }
      adminDoc = querySnapshot.docs[0];
    }
    
    const adminData = adminDoc.data();

    // 5. Enforce Status Checks
    if (adminData?.status !== 'approved') {
      await auth.signOut();
      const status = adminData?.status || 'unknown';
      await logFailedAdminLogin(sanitizedEmail, `Status: ${status}`);
      
      if (status === 'pending') {
        throw new AuthenticationError('Your account is pending approval by the Super Admin.');
      } else if (status === 'rejected') {
        throw new AuthenticationError('Your access request was rejected.');
      } else {
        throw new AuthenticationError('Access denied.');
      }
    }
    
    // 6. Success!
    await persistentRateLimiter.clearAttempts(`email:${sanitizedEmail}`);
    await advancedSecurityMonitor.analyzeLoginAttempt(sanitizedEmail, true);
    await logAdminLogin(user.uid, sanitizedEmail);
    console.log('Admin login successful');
    
  } catch (error: any) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof ValidationError || error instanceof AuthenticationError || error instanceof RateLimitError) {
      throw error;
    }
    const securityError = handleSecurityError(error, 'login');
    throw securityError;
  }
};

// --- FORGOT PASSWORD HANDLER ---
export const handleForgotPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
  try {
    const sanitizedEmail = values.email;
    
    const resetLimitCheck = await persistentRateLimiter.isRateLimited(`reset:${sanitizedEmail}`);
    if (resetLimitCheck.isLimited) {
      console.warn('Rate limit hit for password reset:', sanitizedEmail);
      return; 
    }
    
    // FIXED: Added URL configuration to ensure they return to YOUR site
    const actionCodeSettings = {
      url: window.location.origin + '/login', // Redirects user back to login page after resetting
      handleCodeInApp: true,
    };

    await sendPasswordResetEmail(auth, sanitizedEmail, actionCodeSettings);
    console.log('Password reset email sent to:', sanitizedEmail);
    
  } catch (error: any) {
    // We log the error for debugging but don't show it to the user (security best practice)
    console.error('Detailed Password Reset Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.warn('User tried to reset password for non-existent email');
    }
  }
};

export const getRateLimitInfo = async (email: string) => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    return sanitizedEmail ? await persistentRateLimiter.getAttemptInfo(`email:${sanitizedEmail}`) : { count: 0 };
  } catch {
    return { count: 0 };
  }
};