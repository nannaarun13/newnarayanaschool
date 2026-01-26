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
  query,
  where,
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
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  requestedAt?: string;
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
  const cred = await signInWithEmailAndPassword(
    auth,
    data.email.toLowerCase(),
    data.password
  );

  const user = cred.user;

  // 🔐 Ensure admin record exists & is valid
  const isAdmin = await ensureAdminAccess(user);

  if (!isAdmin) {
    await signOut(auth);
    throw new Error("Access denied. Not an approved admin.");
  }

  return user;
};

export const handleLogout = async (): Promise<void> => {
  await signOut(auth);
};

export const handleForgotPassword = async (
  data: ForgotPasswordFormData
): Promise<void> => {
  await sendPasswordResetEmail(auth, data.email.toLowerCase());
};

/* =======================
   ADMIN CORE LOGIC
======================= */

export const ensureAdminAccess = async (
  user: User | null
): Promise<boolean> => {
  if (!user || !user.uid) return false;

  const email = user.email?.toLowerCase() || "";
  const adminRef = doc(db, "admins", user.uid);
  const snap = await getDoc(adminRef);

  // ✅ Admin document exists
  if (snap.exists()) {
    const data = snap.data();
    return data.status === "approved";
  }

  // 🔥 Auto-create SUPER ADMIN
  if (email === DEFAULT_ADMIN_EMAIL) {
    await setDoc(adminRef, {
      uid: user.uid,
      email,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: "system",
    });
    return true;
  }

  // ❌ Not admin
  return false;
};

export const isUserAdmin = async (
  user: User | null
): Promise<boolean> => {
  if (!user) return false;

  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) return false;

  return adminSnap.data()?.status === "approved";
};

/* =======================
   ADMIN MANAGEMENT
======================= */

export const getAdminRequests = async (): Promise<AdminUser[]> => {
  try {
    const snapshot = await getDocs(collection(db, "admins"));
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      uid: docSnap.id,
      ...docSnap.data(),
    })) as AdminUser[];
  } catch (error) {
    console.error("Failed to fetch admins:", error);
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
