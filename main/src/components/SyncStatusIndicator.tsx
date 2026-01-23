import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, CloudOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { processPendingUpdates } from '@/utils/schoolDataUtils'; // Import the sync function

const SyncStatusIndicator = () => {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'pending' | 'error'>('synced');
  const [pendingCount, setPendingCount] = useState(0);

  // Safe wrapper to check storage
  const checkPendingUpdates = useCallback(async () => {
    try {
      const pendingRaw = localStorage.getItem('pendingUpdates');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
      setPendingCount(pending.length);

      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }

      if (pending.length > 0) {
        // If we are online but have pending items, try to sync them immediately
        setSyncStatus('syncing');
        try {
          await processPendingUpdates();
          setSyncStatus('synced');
          setPendingCount(0);
        } catch (error) {
          console.error("Auto-sync failed:", error);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('synced');
      }
    } catch (error) {
      console.error('Error reading sync status:', error);
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    // Check initially
    checkPendingUpdates();

    // Listen for storage changes (updates from other tabs or logic)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pendingUpdates') {
        checkPendingUpdates();
      }
    };

    // Handle coming online: Actively trigger sync
    const handleOnline = () => {
      console.log('Network restored. Attempting sync...');
      checkPendingUpdates();
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check (every 10 seconds)
    const interval = setInterval(checkPendingUpdates, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkPendingUpdates]);

  // Manual retry handler
  const handleManualSync = () => {
    if (navigator.onLine) {
      checkPendingUpdates();
    }
  };

  const getStatusInfo = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: CheckCircle,
          text: 'Saved',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          animate: false
        };
      case 'syncing':
        return {
          icon: Loader2,
          text: 'Syncing...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          animate: true
        };
      case 'offline':
        return {
          icon: CloudOff,
          text: pendingCount > 0 ? `${pendingCount} changes queued` : 'Offline',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          animate: false
        };
      case 'pending': // Online but hasn't synced yet
        return {
            icon: RefreshCw,
            text: `${pendingCount} unsaved changes`,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            animate: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Sync Failed (Click to retry)',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          animate: false,
          clickable: true
        };
      default:
        return {
            icon: CheckCircle,
            text: 'Unknown',
            color: 'text-gray-500',
            bgColor: 'bg-gray-50',
            animate: false
        };
    }
  };

  const { icon: Icon, text, color, bgColor, animate, clickable } = getStatusInfo();

  return (
    <div 
      onClick={clickable ? handleManualSync : undefined}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${color} ${bgColor} ${clickable ? 'cursor-pointer hover:bg-opacity-80 active:scale-95' : ''}`}
      title={clickable ? "Click to retry sync" : undefined}
    >
      <Icon className={`h-3.5 w-3.5 ${animate ? 'animate-spin' : ''}`} />
      <span>{text}</span>
    </div>
  );
};

export default SyncStatusIndicator;