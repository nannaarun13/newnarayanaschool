import { getSecurityClientInfo } from './securityClientInfo';
import { SECURITY_EVENTS, SecurityEventType } from './securityConfig';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';

// --- Interfaces ---

interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  adminId?: string; // Made optional because failed logins might not have an ID
  email: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface DeviceProfile {
  adminId: string;
  email: string;
  fingerprint: string;
  firstSeen: string;
  lastSeen: string;
  trustScore: number;
  loginCount: number;
  locations: string[];
}

export class AdvancedSecurityMonitor {
  private readonly TRUSTED_DEVICE_THRESHOLD = 5;
  private readonly LOCATION_CHANGE_THRESHOLD = 2;

  /**
   * Main entry point for analyzing logins.
   * Call this function immediately after a user attempts to login.
   */
  async analyzeLoginAttempt(email: string, success: boolean, userId?: string): Promise<void> {
    try {
      const clientInfo = getSecurityClientInfo();
      
      // 1. CRITICAL: Record the attempt first, so analyzeLoginPattern can see it
      await this.logLoginActivity(email, success, userId, clientInfo);

      // 2. Check for rapid failures (Brute Force) - Works even if user is null
      await this.analyzeLoginPattern(email);

      // 3. If login was successful, perform deep profile analysis
      if (success && userId) {
        // Check device fingerprint
        await this.analyzeDeviceFingerprint(userId, email, clientInfo.fingerprint);

        // Check for geographic anomalies
        if (clientInfo.fingerprint?.timezone) {
          await this.analyzeGeographicLocation(userId, email, clientInfo.fingerprint.timezone);
        }

        // Update device profile
        await this.updateDeviceProfile(userId, email, clientInfo.fingerprint);
      }

    } catch (error) {
      console.error('Failed to analyze login attempt:', error);
    }
  }

  // --- Helper: Log the activity to Firestore so we can query it later ---
  private async logLoginActivity(email: string, success: boolean, userId: string | undefined, clientInfo: any) {
    try {
      await addDoc(collection(db, 'admin_login_activities'), {
        email,
        adminId: userId || null,
        status: success ? 'success' : 'failed',
        loginTime: new Date().toISOString(),
        ip: clientInfo.ip || 'unknown',
        userAgent: clientInfo.userAgent || 'unknown'
      });
    } catch (e) {
      console.error("Could not log login activity", e);
    }
  }

  async recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        resolved: false
      };

      await addDoc(collection(db, 'security_events'), securityEvent);