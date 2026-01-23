
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Default admin configuration
export const DEFAULT_ADMIN = {
  email: 'arunnanna3@gmail.com',
  firstName: 'NANNA',
  lastName: 'ARUN',
  phone: '+91 98480 47368'
};

// Create or update the default admin record
export const ensureDefaultAdmin = async (uid: string): Promise<void> => {
  try {
    const adminDocRef = doc(db, 'admins', uid);
    const adminDoc = await getDoc(adminDocRef);
    
    if (!adminDoc.exists()) {
      // Create the default admin record
      await setDoc(adminDocRef, {
        uid,
        firstName: DEFAULT_ADMIN.firstName,
        lastName: DEFAULT_ADMIN.lastName,
        email: DEFAULT_ADMIN.email,
        phone: DEFAULT_ADMIN.phone,
        status: 'approved',
        requestedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: 'system'
      });
      console.log('Default admin record created');
    }
  } catch (error) {
    console.error('Error ensuring default admin:', error);
  }
};
