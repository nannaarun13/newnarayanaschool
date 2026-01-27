// src/utils/adminUtils.ts

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* =======================
   DEFAULT ADMIN CONFIG
======================= */

export const DEFAULT_ADMIN = {
  email: "arunnanna3@gmail.com",
  firstName: "NANNA",
  lastName: "ARUN",
  phone: "+91 98480 47368",
};

/* =======================
   ENSURE DEFAULT ADMIN
======================= */

/**
 * Ensures the super admin exists in Firestore.
 * This should be called ONLY after Firebase Auth login,
 * with a valid authenticated UID.
 */
export const ensureDefaultAdmin = async (
  uid: string,
  email?: string | null
): Promise<void> => {
  if (!uid) {
    console.warn("ensureDefaultAdmin called without uid");
    return;
  }

  try {
    const adminRef = doc(db, "admins", uid);
    const snap = await getDoc(adminRef);

    // ✅ Admin already exists → nothing to do
    if (snap.exists()) {
      return;
    }

    // 🛡️ Only create if email matches default admin
    const safeEmail = typeof email === "string" ? email.toLowerCase() : "";

    if (safeEmail !== DEFAULT_ADMIN.email.toLowerCase()) {
      console.warn("Non-default admin attempted auto-creation:", safeEmail);
      return;
    }

    // 🔥 Create SUPER ADMIN
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

    console.log("✅ Default admin record created");
  } catch (error) {
    console.error("❌ Error ensuring default admin:", error);
  }
};
