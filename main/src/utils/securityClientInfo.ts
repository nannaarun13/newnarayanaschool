// securityClientInfo.ts

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

interface SecurityClientInfo {
  fingerprint: ClientFingerprint;
  ipAddress: string;
  timestamp: string;
  sessionId: string;
}

// Helper to fetch public IP (Essential for security logs)
const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (e) {
    // Fail silently
  }
  return 'unknown';
};

const sanitizeClientData = (data: any, maxLength: number = 200): string => {
  if (!data || typeof data !== 'string') return 'unknown';
  return data
    .replace(/[<>'"&`]/g, '')
    .trim()
    .substring(0, maxLength);
};

export const generateClientFingerprint = (): ClientFingerprint => {
  try {
    // Safe access to navigator properties
    const nav = window.navigator as any;
    
    return {
      userAgent: sanitizeClientData(nav.userAgent, 500),
      screen: window.screen ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` : 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: nav.language || 'unknown',
      // 'platform' is deprecated but still useful. We use a fallback if missing.
      platform: sanitizeClientData(nav.platform || nav.userAgentData?.platform || 'unknown'),
      cookieEnabled: nav.cookieEnabled || false,
      doNotTrack: nav.doNotTrack || 'unknown',
      hardwareConcurrency: nav.hardwareConcurrency || 0
    };
  } catch (error) {
    console.error('Error generating client fingerprint:', error);
    return {
      userAgent: 'unknown',
      screen: 'unknown',
      timezone: 'unknown',
      language: 'unknown',
      platform: 'unknown',
      cookieEnabled: false,
      doNotTrack: 'unknown',
      hardwareConcurrency: 0
    };
  }
};

// Now async to support IP fetching
export const getSecurityClientInfo = async (): Promise<SecurityClientInfo> => {
  const ip = await getPublicIP();
  
  return {
    fingerprint: generateClientFingerprint(),
    ipAddress: ip, 
    timestamp: new Date().toISOString(),
    sessionId: generateSessionId()
  };
};

const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  // Use crypto.getRandomValues for better randomness if available
  const randomPart = window.crypto 
    ? window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    : Math.random().toString(36).substring(2, 15);
    
  return `${timestamp}_${randomPart}`;
};

export const detectAnomalies = (
  currentInfo: SecurityClientInfo, 
  historicalInfo?: SecurityClientInfo[]
): string[] => {
  const anomalies: string[] = [];
  
  if (!historicalInfo || historicalInfo.length === 0) {
    return anomalies;
  }
  
  // Compare against the MOST RECENT login
  const lastKnownInfo = historicalInfo[historicalInfo.