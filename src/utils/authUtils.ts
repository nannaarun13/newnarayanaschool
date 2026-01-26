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

/
