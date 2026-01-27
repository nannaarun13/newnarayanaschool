import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle } from "lucide-react";
import { sessionManager } from "@/utils/sessionManager";

const WARNING_TIME = 5 * 60; // 5 minutes

const SessionTimeoutWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_TIME);

  /* ---------------- SESSION CALLBACKS ---------------- */

  useEffect(() => {
    sessionManager.setCallbacks(
      () => {
        setCountdown(WARNING_TIME);
        setShowWarning(true);
      },
      () => {
        setShowWarning(false);
      }
    );
  }, []);

  /* ---------------- COUNTDOWN TIMER ---------------- */

  useEffect(() => {
    if (!showWarning) return;

    let interval: number = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowWarning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  /* ---------------- ACTIONS ---------------- */

  const handleExtendSession = () => {
    sessionManager.extendSession();
    setShowWarning(false);
  };

  const handleContinue = () => {
    sessionManager.extendSession();
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
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
              Your session will expire in{" "}
              <strong>{formatTime(countdown)}</strong> due to inactivity.
              <br />
              You will be logged out automatically for security.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleContinue}
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
