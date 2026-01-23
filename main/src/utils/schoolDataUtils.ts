import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  Unsubscribe, 
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SchoolData, defaultSchoolData } from '@/contexts/SchoolContext';

const schoolConfigRef = () => doc(db, 'school', 'config');

// Enhanced data persistence with retry mechanism
export const getSchoolData = async (): Promise<SchoolData> => {
  try {
    const docSnap = await getDoc(schoolConfigRef());
    if (docSnap.exists()) {
      const data = { ...defaultSchoolData, ...docSnap.data() } as SchoolData;
      // Always cache the latest data
      localStorage.setItem('schoolData', JSON.stringify(data));
      return data;
    } else {
      // Document doesn't exist. 
      // NOTE: We do NOT write to DB here to avoid permission errors for public users.
      // We just return defaults and cache them.
      localStorage.setItem('schoolData', JSON.stringify(defaultSchoolData));
      return defaultSchoolData;
    }
  } catch (error) {
    console.error('Error fetching school data:', error);
    // Return cached data if available, otherwise return defaults
    const cachedData = localStorage.getItem('schoolData');
    if (cachedData) {
      try {
        return { ...defaultSchoolData, ...JSON.parse(cachedData) };
      } catch {
        return defaultSchoolData;
      }
    }
    return defaultSchoolData;
  }
};

// Enhanced update with local caching and retry
export const updateSchoolData = async (data: Partial<SchoolData>): Promise<void> => {
  try {
    // FIX: Use setDoc with merge: true to prevent overwriting nested objects
    await setDoc(schoolConfigRef(), data, { merge: true });
    
    // Update local cache on successful write
    const currentCache = localStorage.getItem('schoolData');
    const cachedData = currentCache ? JSON.parse(currentCache) : defaultSchoolData;
    const updatedCache = { ...cachedData, ...data };
    localStorage.setItem('schoolData', JSON.stringify(updatedCache));
    
    console.log('School data updated successfully');
  } catch (error) {
    console.error('Failed to update school data:', error);
    
    // Store in pending updates queue for retry
    const pendingUpdates = JSON.parse(localStorage.getItem('pendingUpdates') || '[]');
    pendingUpdates.push({ data, timestamp: Date.now() });
    localStorage.setItem('pendingUpdates', JSON.stringify(pendingUpdates));
    
    // Still update local cache optimistically so the UI feels fast
    const currentCache = localStorage.getItem('schoolData');
    const cachedData = currentCache ? JSON.parse(currentCache) : defaultSchoolData;
    const updatedCache = { ...cachedData, ...data };
    localStorage.setItem('schoolData', JSON.stringify(updatedCache));
    
    throw error;
  }
};

// Process pending updates when connection is restored
export const processPendingUpdates = async (): Promise<void> => {
  const pendingUpdatesRaw = localStorage.getItem('pendingUpdates');
  if (!pendingUpdatesRaw) return;

  const pendingUpdates = JSON.parse(pendingUpdatesRaw);
  if (pendingUpdates.length === 0) return;
  
  console.log(`Processing ${pendingUpdates.length} pending updates...`);
  
  const remainingUpdates = [];

  // Process sequentially to maintain order
  for (const update of pendingUpdates) {
    try {
      // FIX: Use setDoc with merge here as well
      await setDoc(schoolConfigRef(), update.data, { merge: true });
      console.log('Pending update processed successfully');
    } catch (error) {
      console.error('Failed to process pending update:', error);
      // Keep failed updates in queue
      remainingUpdates.push(update);
    }
  }
  
  // Update the queue with whatever failed
  if (remainingUpdates.length > 0) {
    localStorage.setItem('pendingUpdates', JSON.stringify(remainingUpdates));
  } else {
    localStorage.removeItem('pendingUpdates');
    console.log('All pending updates processed');
  }
};

// Real-time subscription with enhanced error handling and caching
export const subscribeToSchoolData = (
  callback: (data: SchoolData) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  return onSnapshot(
    schoolConfigRef(),
    (doc) => {
      if (doc.exists()) {
        // Merge with defaults to ensure all properties are present
        const data = { ...defaultSchoolData, ...doc.data() } as SchoolData;
        
        // Cache the data locally
        localStorage.setItem('schoolData', JSON.stringify(data));
        
        callback(data);
        
        // Process any pending updates when connection is restored
        // (We use a small timeout to let the app initialize first)
        setTimeout(() => processPendingUpdates().catch(console.error), 2000);
      } else {
        // FIX: Do NOT write to DB here. Just use defaults locally.
        console.warn('School config document not found. Using defaults.');
        localStorage.setItem('schoolData', JSON.stringify(defaultSchoolData));
        callback(defaultSchoolData);
      }
    },
    (error) => {
      console.error('Real-time subscription error:', error);
      
      // Fallback to cached data
      const cachedData = localStorage.getItem('schoolData');
      if (cachedData) {
        try {
          const data = { ...defaultSchoolData, ...JSON.parse(cachedData) };
          callback(data);
        } catch (parseError) {
          callback(defaultSchoolData);
        }
      } else {
        callback(defaultSchoolData);
      }
      
      if (onError) onError(error);
    }
  );
};