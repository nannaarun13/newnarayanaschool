// src/utils/authUtils.ts

import { z } from "zod";
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* =======================
   LOGIN SCHEMA
======================= */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/* =======================
   FORGOT PASSWORD SCHEMA
======================= */

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<
  typeof forgotPasswordSchema
>;

/* =======================
   LOGIN HANDLER
======================= */

export const handleLogin = async (
  data: LoginFormData
): Promise<void> => {
  const { email, password } = data;
  await signInWithEmailAndPassword(auth, email, password);
};

/* =======================
   LOGOUT HANDLER
======================= */

export const handleLogout = async (): Promise<void> => {
  await signOut(auth);
};

/* =======================
   FORGOT PASSWORD HANDLER
======================= */

export const handleForgotPassword = async (
  data: ForgotPasswordFormData
): Promise<void> => {
  const { email } = data;
  await sendPasswordResetEmail(auth, email);
};

/* =======================
   ADMIN CHECK
======================= */

export const isUserAdmin = async (
  user: User | null
): Promise<boolean> => {
  try {
    if (!user) return false;

    // Check by UID
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (adminDoc.exists()) {
      return adminDoc.data()?.status === "approved";
    }

    // Fallback: check by email
    if (!user.email) return false;

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
