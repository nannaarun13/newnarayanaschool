// src/utils/authUtils.ts

import { z } from "zod";
import {
  signInWithEmailAndPassword,
  signOut,
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
   LOGIN VALIDATION
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

  await signInWithEmailAndPassword(auth, email, password);
};

/* =======================
   LOGOUT HANDLER
======================= */

export const handleLogout = async (): Promise<void> => {
  await signOut(auth);
};

/* =======================
   ADMIN CHECK (USED BY RouteProtection)
======================= */

export const isUserAdmin = async (
  user: User | null
): Promise<boolean> => {
  try {
    if (!user) return false;

    // 1️⃣ Check by document ID (UID)
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      return data?.status === "approved";
    }

    // 2️⃣ Fallback: check by email
    if (!user.email) return false;

    const q = query(
      collection(db, "admins"),
      where("email", "==", user.email.toLowerCase())
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    return snapshot.docs[0].data()?.status === "approved";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
