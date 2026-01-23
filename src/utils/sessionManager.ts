import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
}

export class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private config: SessionConfig;
  private onWarning?: () => void;
  private onTimeout?: () => void;
  
  // Throttle control
  private lastResetTime: number = 0;
  private readonly THROTTLE_MS = 2000; // Only reset timer max once every 2 seconds

  constructor(config: SessionConfig = { timeoutMinutes: 30, warningMinutes: 5 }) {
    this.config = config;
    this.setupActivityListeners();
    this.setupAuthListener();
  }

  // FIX 1: Define handler as an arrow function property
  // This preserves 'this' context and keeps the function reference stable for removal
  private handleActivity = () => {
    const now = Date.now();
    // FIX 2: Throttle the reset calls to improve performance
    if (now - this.lastResetTime > this.THROTTLE_MS) {
      this.resetTimer();
      this.lastResetTime = now;
    }
  };

  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      // Use the stable arrow function reference
      document.addEventListener(event, this.handleActivity, true);
    });
  }

  private setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.resetTimer();
      } else {
        this.clearTimers();
      }
    });
  }

  setCallbacks(onWarning: () => void, onTimeout: () => void) {
    this.onWarning = onWarning;
    this.onTimeout = onTimeout;
  }

  private resetTimer() {
    this.clearTimers();
    
    if (auth.currentUser) {
      const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
      const warningMs = (this.config.timeoutMinutes - this.config.warningMinutes) * 60 * 1000;

      // Safety check: Ensure warning happens before timeout
      const validWarningMs = warningMs > 0 ? warningMs : timeoutMs - 60000; 

      // Set warning timer
      this.warningId = setTimeout(() => {
        if (this.onWarning) this.onWarning();
      }, validWarningMs);

      // Set timeout timer
      this.timeoutId = setTimeout(() => {
        this.handleTimeout();
      }, timeoutMs);
    }
  }

  private clearTimers() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
  }

  private async handleTimeout() {
    console.log('Session timeout - logging out user');
    try {
      this.clearTimers(); // Clear timers immediately to prevent double-firing
      await auth.signOut();
      if (this.onTimeout) this.onTimeout();
    } catch (error) {
      console.error('Error during session timeout logout:', error);
    }
  }

  extendSession() {
    this.resetTimer();
  }

  destroy() {
    this.clearTimers();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      // Now this actually removes the listener because the reference matches
      document.removeEventListener(event, this.handleActivity, true);
    });
  }
}

export const sessionManager = new SessionManager();