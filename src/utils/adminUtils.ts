// src/utils/adminUtils.ts

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* =========================
   SUPER ADMIN CONFIG
========================= */

export const DEFAULT_ADMIN = {
  email: "arunnanna3@gmail.com",
  firstName: "NANNA",
  lastName: "ARUN",
  phone: "+91 98480 47368",
};

/* =========================
   ENSURE SUPER ADMIN
========================= */

/**
 * Creates the super admin record if it does not already exist.
 * Must be called AFTER Firebase authentication.
 */
export const ensureDefaultAdmin = async (
  uid: string,
  email?: string | null
): Promise<void> => {
  if (!uid) return;

  try {
    const adminRef = doc(db, "admins", uid);
    const snapshot = await getDoc(adminRef);

    // ✅ Already exists
    if (snapshot.exists()) return;

    // 🔐 Allow auto-create ONLY for default admin email
    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase() : "";

    if (normalizedEmail !== DEFAULT_ADMIN.email.toLowerCase()) {
      return;
    }

    // 🔥 Create super admin
    await setDoc(adminRef, {
      uid,
      email: DEFAULT_ADMIN.email,
      firstName: DEFAULT_ADMIN.firstName,
      lastName: DEFAULT_ADMIN.lastName,
      phone: DEFAULT_ADMIN.phone,
      status: "approved",
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "system",
    });

    console.info("✅ Super admin created successfully");
  } catch (err) {
    console.error("❌ Failed to ensure super admin:", err);
  }
};
