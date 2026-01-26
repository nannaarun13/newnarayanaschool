// src/utils/advancedSecurityMonitor.ts

import { getSecurityClientInfo } from "./securityClientInfo";
import { SECURITY_EVENTS, SecurityEventType } from "./securityConfig";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

/* =======================
   INTERFACES
======================= */

export interface SecurityEvent {
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

/* =======================
   CLASS
======================= */

export class AdvancedSecurityMonitor {
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

      await this.logLoginActivity(email, success, userId, clientInfo);
      await this.analyzeLoginPattern(email);

      if (success && userId && clientInfo?.fingerprint) {
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
      }
    } catch (error) {
      console.error("Security analysis failed:", error);
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
  ): Promise<void> {
    await addDoc(collection(db, "admin_login_activities"), {
      email,
      adminId: userId || null,
      status: success ? "success" : "failed",
      loginTime: new Date().toISOString(),
      ip: clientInfo?.ip || "unknown",
      userAgent: clientInfo?.userAgent || "unknown",
      timezone: clientInfo?.fingerprint?.timezone || null,
    });
  }

  private async analyzeLoginPattern(email: string): Promise<void> {
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
        details: { attempts: failures.length },
      });
    }
  }

  private async analyzeDeviceFingerprint(
    adminId: string,
    email: string,
    fingerprint: any
  ): Promise<void> {
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
  }

  private async analyzeGeographicLocation(
    adminId: string,
    email: string,
    timezone: string
  ): Promise<void> {
    const q = query(
      collection(db, "admin_login_activities"),
      where("adminId", "==", adminId),
      orderBy("loginTime", "desc"),
      limit(this.LOCATION_CHANGE_THRESHOLD)
    );

    const snapshot = await getDocs(q);
    const timezones = snapshot.docs
      .map((d) => d.data().timezone)
      .filter(Boolean);

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
  }

  private async recordSecurityEvent(
    event: Omit<SecurityEvent, "id" | "timestamp" | "resolved">
  ): Promise<void> {
    await addDoc(collection(db, "security_events"), {
      ...event,
      timestamp: new Date().toISOString(),
      resolved: false,
    });
  }
}

/* =======================
   SINGLETON EXPORT
======================= */

export const advancedSecurityMonitor = new AdvancedSecurityMonitor();
