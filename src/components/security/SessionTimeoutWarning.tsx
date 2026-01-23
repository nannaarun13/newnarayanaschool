
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { sessionManager } from '@/utils/sessionManager';

const SessionTimeoutWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    sessionManager.setCallbacks(
      () => {
        setShowWarning(true);
        setCountdown(5 * 60);
      },
      () => {
        setShowWarning(false);
        // User will be redirected by auth state change
      }
    );
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showWarning && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWarning, countdown]);

  const handleExtendSession = () => {
    sessionManager.extendSession();
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-orange-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Session Timeout Warning
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your session will expire in <strong>{formatTime(countdown)}</strong> due to inactivity.
              You will be automatically logged out for security reasons.
            </AlertDescription>
          </Alert>
          <div className="flex justify-between space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowWarning(false)}
              className="flex-1"
            >
              Continue Working
            </Button>
            <Button 
              onClick={handleExtendSession}
              className="flex-1 bg-school-blue hover:bg-school-blue/90"
            >
              Extend Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeoutWarning;
