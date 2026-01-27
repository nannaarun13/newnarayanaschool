// src/utils/securityClientInfo.ts

interface ClientFingerprint {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  hardwareConcurrency: number;
}

export interface SecurityClientInfo {
  fingerprint: ClientFingerprint;
  ipAddress: string;
  timestamp: string;
  sessionId: string;
}

// --------------------
// Helper: Public IP
// --------------------
const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch {
    // ignore
  }
  return "unknown";
};

// --------------------
// Helper: Sanitize
// --------------------
const sanitizeClientData = (
  data: unknown,
  maxLength: number = 200
): string => {
  if (!data || typeof data !== "string") return "unknown";
  return data.replace(/[<>'"&`]/g, "").trim().substring(0, maxLength);
};

// --------------------
// Fingerprint (SSR SAFE)
// --------------------
export const generateClientFingerprint = (): ClientFingerprint => {
  if (typeof window === "undefined") {
    return {
      userAgent: "unknown",
      screen: "unknown",
      timezone: "unknown",
      language: "unknown",
      platform: "unknown",
      cookieEnabled: false,
      doNotTrack: "unknown",
      hardwareConcurrency: 0,
    };
  }

  try {
    const nav = window.navigator as any;

    return {
      userAgent: sanitizeClientData(nav?.userAgent, 500),
      screen: window.screen
        ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
        : "unknown",
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      language: nav?.language || "unknown",
      platform: sanitizeClientData(
        nav?.platform || nav?.userAgentData?.platform || "unknown"
      ),
      cookieEnabled: Boolean(nav?.cookieEnabled),
      doNotTrack: nav?.doNotTrack || "unknown",
      hardwareConcurrency: nav?.hardwareConcurrency || 0,
    };
  } catch {
    return {
      userAgent: "unknown",
      screen: "unknown",
      timezone: "unknown",
      language: "unknown",
      platform: "unknown",
      cookieEnabled: false,
      doNotTrack: "unknown",
      hardwareConcurrency: 0,
    };
  }
};

// --------------------
// Session ID (SSR SAFE)
// --------------------
const generateSessionId = (): string => {
  if (typeof window === "undefined") {
    return `server_${Date.now().toString(36)}`;
  }

  const timestamp = Date.now().toString(36);
  const randomPart =
    window.crypto && "getRandomValues" in window.crypto
      ? window.crypto
          .getRandomValues(new Uint32Array(1))[0]
          .toString(36)
      : Math.random().toString(36).substring(2, 15);

  return `${timestamp}_${randomPart}`;
};

// --------------------
// Main Client Info (SSR SAFE)
// --------------------
export const getSecurityClientInfo =
  async (): Promise<SecurityClientInfo> => {
    if (typeof window === "undefined") {
      return {
        fingerprint: generateClientFingerprint(),
        ipAddress: "unknown",
        timestamp: new Date().toISOString(),
        sessionId: generateSessionId(),
      };
    }

    const ip = await getPublicIP();

    return {
      fingerprint: generateClientFingerprint(),
      ipAddress: ip,
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId(),
    };
  };

// --------------------
// Optional Anomaly Detection
// --------------------
export const detectAnomalies = (
  currentInfo: SecurityClientInfo,
  historicalInfo?: SecurityClientInfo[]
): string[] => {
  const anomalies: string[] = [];

  if (!historicalInfo || historicalInfo.length === 0) {
    return anomalies;
  }

  const lastKnownInfo = historicalInfo[0];

  if (
    lastKnownInfo.fingerprint.timezone !==
    currentInfo.fingerprint.timezone
  ) {
    anomalies.push("Timezone changed");
  }

  if (
    lastKnownInfo.fingerprint.platform !==
    currentInfo.fingerprint.platform
  ) {
    anomalies.push("Platform changed");
  }

  if (
    lastKnownInfo.fingerprint.userAgent !==
    currentInfo.fingerprint.userAgent
  ) {
    anomalies.push("User agent changed");
  }

  return anomalies;
};
