// src/utils/authUtils.ts

import { z } from "zod";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteField,
  UpdateData,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* =======================
   CONSTANTS
======================= */

export const DEFAULT_ADMIN_EMAIL = "arunnanna3@gmail.com";

/* =======================
   TYPES
======================= */

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  revokedAt?: string;
  revokedBy?: string;
}

/* =======================
   VALIDATION SCHEMAS
======================= */

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/* =======================
   AUTH ACTIONS
======================= */

export const handleLogin = async (
  data: LoginFormData
): Promise<User> => {
  // 🛡️ HARD SAFETY (prevents indexOf crash)
  const email =
    typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";
  const password =
    typeof data?.password === "string" ? data.password : "";

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const allowed = await ensureAdminAccess(user);

  if (!allowed) {
    await signOut(auth);
    throw new Error("Your account is not approved by the Super Admin.");
  }

  return user;
};

export const handleLogout = async (): Promise<void> => {
  await signOut(auth);
};

export const handleForgotPassword = async (
  data: ForgotPasswordFormData
): Promise<void> => {
  const email =
    typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";

  if (!email) {
    throw new Error("Email is required");
  }

  await sendPasswordResetEmail(auth, email);
};

/* =======================
   ADMIN CORE LOGIC
======================= */

export const ensureAdminAccess = async (
  user: User | null
): Promise<boolean> => {
  if (!user?.uid || !user.email) return false;

  const email = user.email.toLowerCase();
  const ref = doc(db, "admins", user.uid);
  const snap = await getDoc(ref);

  // ✅ Admin exists
  if (snap.exists()) {
    return snap.data()?.status === "approved";
  }

  // 🔥 Auto-create Super Admin
  if (email === DEFAULT_ADMIN_EMAIL) {
    await setDoc(ref, {
      uid: user.uid,
      email,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: "system",
    });
    return true;
  }

  return false;
};

/* =======================
   ADMIN MANAGEMENT
======================= */

export const getAdminRequests = async (): Promise<AdminUser[]> => {
  try {
    const snapshot = await getDocs(collection(db, "admins"));
    return snapshot.docs.map((d) => ({
      id: d.id,
      uid: d.id,
      ...(d.data() as any),
    }));
  } catch (err) {
    console.error("Failed to fetch admins:", err);
    return [];
  }
};

export const updateAdminRequestStatus = async (
  uid: string,
  status: "approved" | "rejected" | "revoked",
  actionBy = "system"
): Promise<void> => {
  const ref = doc(db, "admins", uid);
  const now = new Date().toISOString();

  const updateData: UpdateData<any> = { status };

  if (status === "approved") {
    updateData.approvedAt = now;
    updateData.approvedBy = actionBy;
    updateData.rejectedAt = deleteField();
    updateData.revokedAt = deleteField();
  }

  if (status === "rejected") {
    updateData.rejectedAt = now;
    updateData.rejectedBy = actionBy;
  }

  if (status === "revoked") {
    updateData.revokedAt = now;
    updateData.revokedBy = actionBy;
  }

  await updateDoc(ref, updateData);
};
