import { getSecurityClientInfo } from "./securityClientInfo";
import { SECURITY_EVENTS, SecurityEventType } from "./securityConfig";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

/* =======================
   INTERFACES
======================= */

interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  adminId?: string;
  email: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
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

/* =======================
   CLASS
======================= */

export class AdvancedSecurityMonitor {
  private readonly TRUSTED_DEVICE_THRESHOLD = 5;
  private readonly LOCATION_CHANGE_THRESHOLD = 2;

  /* =======================
     MAIN ENTRY
  ======================= */

  async analyzeLoginAttempt(
    email: string,
    success: boolean,
    userId?: string
  ): Promise<void> {
    try {
      const clientInfo = await getSecurityClientInfo();

      // 1. Log activity
      await this.logLoginActivity(email, success, userId, clientInfo);

      // 2. Analyze brute-force attempts
      await this.analyzeLoginPattern(email);

      // 3. Deep analysis on success
      if (success && userId) {
        if (clientInfo.fingerprint) {
          await this.analyzeDeviceFingerprint(
            userId,
            email,
            clientInfo.fingerprint
          );

          if (clientInfo.fingerprint.timezone) {
            await this.analyzeGeographicLocation(
              userId,
              email,
              clientInfo.fingerprint.timezone
            );
          }

          await this.updateDeviceProfile(
            userId,
            email,
            clientInfo.fingerprint
          );
        }
      }
    } catch (error) {
      console.error("Failed to analyze login attempt:", error);
    }
  }

  /* =======================
     HELPERS
  ======================= */

  private async logLoginActivity(
    email: string,
    success: boolean,
    userId: string | undefined,
    clientInfo: any
  ) {
    try {
      await addDoc(collection(db, "admin_login_activities"), {
        email,
        adminId: userId || null,
        status: success ? "success" : "failed",
        loginTime: new Date().toISOString(),
        ip: clientInfo.ip || "unknown",
        userAgent: clientInfo.userAgent || "unknown",
      });
    } catch (e) {
      console.error("Could not log login activity", e);
    }
  }

  async recordSecurityEvent(
    event: Omit<SecurityEvent, "id" | "timestamp" | "resolved">
  ): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        resolved: false,
      };

      await addDoc(collection(db, "security_events"), securityEvent);
    } catch (error) {
      console.error("Failed to record security event:", error);
    }
  }

  private async analyzeLoginPattern(email: string): Promise<void> {
    try {
      const q = query(
        collection(db, "admin_login_activities"),
        where("email", "==", email),
        orderBy("loginTime", "desc"),
        limit(5)
      );

      const snapshot = await getDocs(q);
      const failures = snapshot.docs.filter(
        (d) => d.data().status === "failed"
      );

      if (failures.length >= 3) {
        await this.recordSecurityEvent({
          type: SECURITY_EVENTS.BRUTE_FORCE,
          email,
          severity: "high",
          adminId: undefined,
          details: { attempts: failures.length },
        });
      }
    } catch (error) {
      console.error("Failed to analyze login pattern:", error);
    }
  }

  private async analyzeDeviceFingerprint(
    adminId: string,
    email: string,
    fingerprint: any
  ): Promise<void> {
    try {
      if (!fingerprint?.id) return;

      const q = query(
        collection(db, "device_profiles"),
        where("adminId", "==", adminId),
        where("fingerprint", "==", fingerprint.id),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await this.recordSecurityEvent({
          type: SECURITY_EVENTS.NEW_DEVICE,
          email,
          adminId,
          severity: "medium",
          details: { fingerprint },
        });
      }
    } catch (error) {
      console.error("Device fingerprint analysis failed:", error);
    }
  }

  private async analyzeGeographicLocation(
    adminId: string,
    email: string,
    timezone: string
  ): Promise<void> {
    try {
      const q = query(
        collection(db, "admin_login_activities"),
        where("adminId", "==", adminId),
        orderBy("loginTime", "desc"),
        limit(this.LOCATION_CHANGE_THRESHOLD)
      );

      const snapshot = await getDocs(q);
      const timezones = snapshot.docs.map((d) => d.data().timezone);

      if (
        timezones.length >= this.LOCATION_CHANGE_THRESHOLD &&
        !timezones.includes(timezone)
      ) {
        await this.recordSecurityEvent({
          type: SECURITY_EVENTS.LOCATION_CHANGE,
          email,
          adminId,
          severity: "medium",
          details: { timezone },
        });
      }
    } catch (error) {
      console.error("Geographic analysis failed:", error);
    }
  }

  private async updateDeviceProfile(
    adminId: string,
    email: string,
    fingerprint: any
  ): Promise<void> {
    try {
      await addDoc(collection(db, "device_profiles"), {
        adminId,
        email,
        fingerprint: fingerprint.id,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        trustScore: 1,
        loginCount: 1,
        locations: fingerprint.timezone ? [fingerprint.timezone] : [],
      });
    } catch (error) {
      console.error("Failed to update device profile:", error);
    }
  }
}
