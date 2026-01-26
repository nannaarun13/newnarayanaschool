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
  updateDoc,
  deleteField,
  UpdateData,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* =======================
   TYPES
======================= */

export interface AdminUser {
  uid: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  revokedAt?: string;
  revokedBy?: string;
}

/* =======================
   SCHEMAS
======================= */

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/* =======================
   AUTH HANDLERS
======================= */

export const handleLogin = async (data: LoginFormData): Promise<void> => {
  await signInWithEmailAndPassword(auth, data.email, data.password);
};

export const handleLogout = async (): Promise<void> => {
  await signOut(auth);
};

export const handleForgotPassword = async (data: ForgotPasswordFormData): Promise<void> => {
  await sendPasswordResetEmail(auth, data.email);
};

/* =======================
   ADMIN CHECK
======================= */

export const isUserAdmin = async (user: User | null): Promise<boolean> => {
  try {
    if (!user) return false;

    // Check by UID first (most secure)
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (adminDoc.exists()) {
      return adminDoc.data()?.status === "approved";
    }

    if (!user.email) return false;

    // Fallback: Check by Email
    const q = query(
      collection(db, "admins"),
      where("email", "==", user.email.toLowerCase())
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    return snapshot.docs[0].data()?.status === "approved";
  } catch (error) {
    console.error("Admin check failed:", error);
    return false;
  }
};

/* =======================
   ADMIN REQUESTS
======================= */

export const getAdminRequests = async (): Promise<AdminUser[]> => {
  try {
    const q = query(collection(db, "admins"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        uid: data.uid || docSnap.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        status: data.status || "pending",
        requestedAt: data.requestedAt || new Date().toISOString(),
        ...data, // Spread remaining optional fields (approvedAt, etc.)
      } as AdminUser;
    });
  } catch (error) {
    console.error("Failed to fetch admin requests:", error);
    return [];
  }
};

export const updateAdminRequestStatus = async (
  uid: string,
  status: "approved" | "rejected" | "revoked",
  actionBy?: string
): Promise<void> => {
  const ref = doc(db, "admins", uid);
  const now = new Date().toISOString();

  // Using UpdateData<any> ensures Firestore accepts deleteField() alongside strings
  const updateData: UpdateData<any> = { status };

  if (status === "approved") {
    updateData.approvedAt = now;
    updateData.approvedBy = actionBy || "system";
    updateData.rejectedAt = deleteField();
    updateData.revokedAt = deleteField();
  } else if (status === "rejected") {
    updateData.rejectedAt = now;
    updateData.rejectedBy = actionBy || "system";
    updateData.approvedAt = deleteField();
  } else if (status === "revoked") {
    updateData.revokedAt = now;
    updateData.revokedBy = actionBy || "system";
  }

  await updateDoc(ref, updateData);
};