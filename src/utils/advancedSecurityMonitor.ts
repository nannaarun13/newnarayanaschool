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
  Timestamp,
} from "firebase/firestore";

/* =======================
   TYPES
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
}

/* =======================
   CLASS
======================= */

export class AdvancedSecurityMonitor {
  private readonly LOCATION_CHANGE_THRESHOLD = 2;

  /* =======================
     LOGIN ANALYSIS
  ======================= */

  async analyzeLoginAttempt(
    email: string,
    success: boolean,
    userId?: string
  ): Promise<void> {
    try {
      // SSR SAFETY
      if (typeof window === "undefined") return;

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
     METRICS (FIXED)
  ======================= */

  async getSecurityMetrics() {
    try {
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const q = query(
        collection(db, "security_events"),
        where("timestamp", ">=", since.toISOString()),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map((d) => d.data());

      const metrics = {
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.severity === "critical").length,
        highSeverityEvents: events.filter(e => e.severity === "high").length,
        unresolvedEvents: events.filter(e => !e.resolved).length,
        eventsByType: {} as Record<string, number>,
        last24Hours: events,
      };

      for (const event of events) {
        metrics.eventsByType[event.type] =
          (metrics.eventsByType[event.type] || 0) + 1;
      }

      return metrics;
    } catch (error) {
      console.error("Failed to load security metrics:", error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        highSeverityEvents: 0,
        unresolvedEvents: 0,
        eventsByType: {},
        last24Hours: [],
      };
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
      ip: clientInfo?.ipAddress || "unknown",
      userAgent: clientInfo?.fingerprint?.userAgent || "unknown",
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
    if (!fingerprint?.userAgent) return;

    const q = query(
      collection(db, "device_profiles"),
      where("adminId", "==", adminId),
      where("fingerprint", "==", fingerprint.userAgent),
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
