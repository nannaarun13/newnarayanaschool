import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* =======================
   TYPES
======================= */

export interface LoginActivity {
  adminId?: string; // Optional for failed logins
  email: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed";
  failureReason?: string;
}

/* =======================
   HELPERS
======================= */

// Fetch public IP
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

// Sanitize generic strings
const sanitizeString = (input: unknown, maxLength = 500): string => {
  if (!input || typeof input !== "string") return "unknown";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"&`]/g, "")
    .trim()
    .substring(0, maxLength);
};

// Sanitize and validate email
const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== "string") return "";
  const cleaned = email.toLowerCase().trim();

  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(cleaned) || cleaned.length > 100) {
    return "";
  }
  return cleaned;
};

// Get client info
const getSecureClientInfo = async () => {
  try {
    const userAgent = navigator.userAgent || "unknown";
    const ipAddress = await getPublicIP();

    return {
      ipAddress: sanitizeString(ipAddress, 50),
      userAgent: sanitizeString(userAgent, 500),
    };
  } catch (error) {
    console.error("Error getting client info:", error);
    return {
      ipAddress: "unknown",
      userAgent: "unknown",
    };
  }
};

/* =======================
   LOGGING FUNCTIONS
======================= */

// Log successful admin login
export const logAdminLogin = async (
  adminId: string,
  email: string
): Promise<void> => {
  try {
    if (!adminId) return;

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) return;

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email?.toLowerCase() !== sanitizedEmail) {
      console.warn("Login logging skipped: user mismatch");
      return;
    }

    const clientInfo = await getSecureClientInfo();

    const loginActivity: LoginActivity = {
      adminId: sanitizeString(adminId, 100),
      email: sanitizedEmail,
      loginTime: new Date().toISOString(),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      status: "success",
    };

    await addDoc(
      collection(db, "admin_login_activities"),
      loginActivity
    );
  } catch (error) {
    console.error("Failed to log admin login:", error);
  }
};

// Log failed admin login
export const logFailedAdminLogin = async (
  email: string,
  reason: string
): Promise<void> => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedReason = sanitizeString(reason, 500);

    const clientInfo = await getSecureClientInfo();

    const loginActivity: LoginActivity = {
      email: sanitizedEmail || "invalid-email-format",
      loginTime: new Date().toISOString(),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      status: "failed",
      failureReason: sanitizedReason,
    };

    await addDoc(
      collection(db, "admin_login_activities"),
      loginActivity
    );
  } catch (error) {
    console.error("Failed to log failed admin login:", error);
  }
};

// Fetch recent login activities
export const getRecentLoginActivities = async (
  limitCount = 10
): Promise<LoginActivity[]> => {
  try {
    const q = query(
      collection(db, "admin_login_activities"),
      orderBy("loginTime", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as LoginActivity);
  } catch (error) {
    console.error("Failed to fetch login activities:", error);
    return [];
  }
};
