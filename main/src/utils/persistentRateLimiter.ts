import { doc, getDoc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RateLimitData {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  escalationCount?: number;
  isLockedOut?: boolean;
}

export class PersistentRateLimiter {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ESCALATION_ATTEMPTS = 10;
  private readonly ESCALATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  // --- SAFE HASHING ---
  // We use a cleaner key generation method to avoid collisions
  private async getRateLimitDocRef(identifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(identifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return doc(db, 'rate_limits', `lim_${hashHex.substring(0, 32)}`);
  }

  // --- CHECK STATUS ---
  async isRateLimited(identifier: string): Promise<{ isLimited: boolean; timeRemaining?: number; reason?: string }> {
    try {
      const now = Date.now();
      const docRef = await this.getRateLimitDocRef(identifier);
      const rateLimitDoc = await getDoc(docRef);
      
      if (!rateLimitDoc.exists()) {
        return { isLimited: false };
      }

      const data = rateLimitDoc.data() as RateLimitData;

      // 1. Check Extended Lockout (Escalation)
      if (data.isLockedOut) {
        const lockoutRemaining = this.ESCALATION_WINDOW_MS - (now - data.lastAttempt);
        if (lockoutRemaining > 0) {
          return { 
            isLimited: true, 
            timeRemaining: lockoutRemaining,
            reason: 'Account temporarily locked due to excessive failed attempts.' 
          };
        }
        // Lockout expired, we can proceed (recordFailedAttempt will handle cleanup)
      }

      // 2. Check Standard