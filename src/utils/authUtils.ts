import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteField // <--- Added this required import
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AdminUser {
  uid: string; // Firebase Auth UID
  id: string; // Firestore Document ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requestedAt: string; // ISO string
  approvedAt?: string;
  approvedBy?: string; // email of the approving admin
  rejectedAt?: string;
  rejectedBy?: string; // email of the rejecting admin
  revokedAt?: string;
  revokedBy?: string; // email of the revoking admin
}

// Enhanced input sanitization with comprehensive validation
const sanitizeString = (input: any, maxLength: number = 50): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, maxLength);
};

const sanitizeEmail = (input: any): string => {
  if (!input || typeof input !== 'string') return '';
  const email = input.toLowerCase().trim();
  // Enhanced email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    return '';
  }
  return email;
};

const sanitizePhone = (input: any): string => {
  if (!input || typeof input !== 'string') return '';
  // Remove all non-digit characters except +
  const cleaned = input.replace(/[^\d+]/g, '');
  // Validate international format (+91 followed by 10 digits)
  if (!/^\+91\d{10}$/.test(cleaned)) {
    return '';
  }
  return cleaned;
};

const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const cleaned = name.trim();
  // Allow only letters, spaces, hyphens, and apostrophes
  return /^[a-zA-Z\s\-']{1,50}$/.test(cleaned) && cleaned.length >= 1;
};

// Helper function to validate if a date string is valid ISO format
const isValidISODate = (dateString: any): boolean => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T') && dateString.includes('Z');
};

// Enhanced admin data validation
const validateAdminData = (data: any): boolean => {
  return data &&
    validateName(data.firstName) &&
    validateName(data.lastName) &&
    sanitizeEmail(data.email) !== '' &&
    sanitizePhone(data.phone) !== '' &&
    ['pending', 'approved', 'rejected', 'revoked'].includes(data.status) &&
    isValidISODate(data.requestedAt);
};

// Fetches all admin requests with enhanced validation
export const getAdminRequests = async (): Promise<AdminUser[]> => {
  try {
    const q = query(collection(db, 'admins'));
    const querySnapshot = await getDocs(q);
    const requests: AdminUser[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Enhanced validation with sanitization
      if (validateAdminData(data)) {
        const sanitizedFirstName = sanitizeString(data.firstName);
        const sanitizedLastName = sanitizeString(data.lastName);
        const sanitizedEmail = sanitizeEmail(data.email);
        const sanitizedPhone = sanitizePhone(data.phone);
        
        if (sanitizedFirstName && sanitizedLastName && sanitizedEmail && sanitizedPhone) {
          requests.push({ 
            uid: data.uid || doc.id, 
            id: doc.id, 
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            status: data.status,
            requestedAt: data.requestedAt,
            approvedAt: data.approvedAt,
            approvedBy: data.approvedBy ? sanitizeEmail(data.approvedBy) : undefined,
            rejectedAt: data.rejectedAt,
            rejectedBy: data.rejectedBy ? sanitizeEmail(data.rejectedBy) : undefined,
            revokedAt: data.revokedAt,
            revokedBy: data.revokedBy ? sanitizeEmail(data.revokedBy) : undefined
          } as AdminUser);
        }
      } else {
        console.warn('Skipping admin record with invalid/missing data:', doc.id);
      }
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting admin requests:', error);
    return [];
  }
};

// Enhanced admin status update with comprehensive validation
export const updateAdminRequestStatus = async (
  uid: string,
  status: 'approved' | 'rejected' | 'revoked',
  approvedByEmail?: string
): Promise<void> => {
  try {
    // Enhanced input validation
    if (!uid || typeof uid !== 'string' || uid.length > 100) {
      throw new Error('Invalid UID provided');
    }
    
    if (!['approved', 'rejected', 'revoked'].includes(status)) {
      throw new Error('Invalid status provided');
    }

    if (approvedByEmail) {
      const sanitizedApproverEmail = sanitizeEmail(approvedByEmail);
      if (!sanitizedApproverEmail) {
        throw new Error('Invalid approver email provided');
      }
    }

    const adminDocRef = doc(db, 'admins', uid);
    const currentDoc = await getDoc(adminDocRef);
    
    if (!currentDoc.exists()) {
      throw new Error('Admin record not found');
    }

    const currentData = currentDoc.data();
    // OPTIONAL: Relaxed validation here to allow fixing broken records
    // if (!validateAdminData(currentData)) { throw new Error('Invalid admin record data'); }

    const updateData: any = { status };
    const currentTime = new Date().toISOString();
    
    if (status === 'approved') {
      updateData.approvedAt = currentTime;
      if (approvedByEmail) {
        updateData.approvedBy = sanitizeEmail(approvedByEmail);
      }
      // FIX: Use deleteField() instead of null
      updateData.rejectedAt = deleteField();
      updateData.rejectedBy = deleteField();
      updateData.revokedAt = deleteField();
      updateData.revokedBy = deleteField();
    } else if (status === 'rejected') {
      updateData.rejectedAt = currentTime;
      if (approvedByEmail) {
        updateData.rejectedBy = sanitizeEmail(approvedByEmail);
      }
      // FIX: Remove approval data
      updateData.approvedAt = deleteField();
      updateData.approvedBy = deleteField();
    } else if (status === 'revoked') {
      updateData.revokedAt = currentTime;
      if (approvedByEmail) {
        updateData.revokedBy = sanitizeEmail(approvedByEmail);
      }
      // FIX: Remove approval data
      updateData.approvedAt = deleteField();
      updateData.approvedBy = deleteField();
    }
    
    await updateDoc(adminDocRef, updateData);
    console.log('Admin request status updated for UID:', uid, 'to:', status);
  } catch (error) {
    console.error('Error updating admin request status:', error);
    throw error;
  }
};

// Enhanced admin verification with additional security checks
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    if (!uid || typeof uid !== 'string' || uid.length > 100) {
      return false;
    }

    const user = await getDoc(doc(db, 'admins', uid));
    if (!user.exists()) {
      // Try to find by Firebase UID with enhanced validation
      const q = query(collection(db, 'admins'), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return false;
      }
      
      const userData = querySnapshot.docs[0].data();
      return validateAdminData(userData) && userData.status === 'approved';
    }
    
    const userData = user.data();
    return validateAdminData(userData) && userData.status === 'approved';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Enhanced admin retrieval by email with validation
export const getAdminByEmail = async (email: string): Promise<AdminUser | null> => {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return null;
    }
    
    const q = query(collection(db, "admins"), where("email", "==", sanitizedEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const adminDoc = querySnapshot.docs[0];
    const data = adminDoc.data();
    
    // Enhanced validation
    if (!validateAdminData(data)) {
      console.warn('Invalid admin data found:', adminDoc.id);
      return null;
    }
    
    return { 
      id: adminDoc.id, 
      uid: data.uid || adminDoc.id, 
      firstName: sanitizeString(data.firstName),
      lastName: sanitizeString(data.lastName),
      email: sanitizedEmail,
      phone: sanitizePhone(data.phone),
      status: data.status,
      requestedAt: data.requestedAt,
      approvedAt: data.approvedAt,
      approvedBy: data.approvedBy ? sanitizeEmail(data.approvedBy) : undefined,
      rejectedAt: data.rejectedAt,
      rejectedBy: data.rejectedBy ? sanitizeEmail(data.rejectedBy) : undefined,
      revokedAt: data.revokedAt,
      revokedBy: data.revokedBy ? sanitizeEmail(data.revokedBy) : undefined
    } as AdminUser;
  } catch (error) {
    console.error("Error getting admin by email:", error);
    return null;
  }
};