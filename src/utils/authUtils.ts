// src/utils/authUtils.ts

import { z } from "zod";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/* =======================
   LOGIN VALIDATION SCHEMA
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
   LOGIN HANDLER
======================= */

export const handleLogin = async (
  data: LoginFormData
): Promise<void> => {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("Login failed:", error);
    throw new Error(
      error?.message || "Invalid email or password"
    );
  }
};

/* =======================
   LOGOUT HANDLER
======================= */

export const handleLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};
