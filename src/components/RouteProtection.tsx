import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isUserAdmin } from '@/utils/authUtils';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import SessionTimeoutWarning from '@/components/security/SessionTimeoutWarning';

const RouteProtection = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. GLOBAL AUTH LISTENER (Run once on mount)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is logged in, check if they are an Admin
          const adminStatus = await isUserAdmin(user.uid);
          setIsAdmin(adminStatus);
          setCurrentUser(user);
        } else {
          // User is logged out
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCurrentUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. ROUTE GUARD LOGIC (Run when location, loading, or user changes)
  useEffect(() => {
    if (isLoading) return; // Wait for initial check to finish

    const path = location.pathname;
    const isAdminRoute = path.startsWith('/admin');
    // Auth pages are Login OR Register
    const isAuthPage = path === '/login' || path === '/admin/register'; 

    // SCENARIO A: User is logged in as Admin
    if (currentUser && isAdmin) {
      // If they try to go to Login or Register, send them to Dashboard
      if (isAuthPage) {
        navigate('/admin', { replace: true });
      }
      return;
    }

    // SCENARIO B: User is logged in BUT NOT Admin (Pending or Rejected)
    if (currentUser && !isAdmin) {
      if (isAdminRoute && !isAuthPage) {
        toast({
          title: "Access Denied",
          description: "Your account does not have admin privileges or is pending approval.",
          variant: "destructive",
        });
        // Sign out to prevent stuck state
        auth.signOut();
        navigate('/login', { replace: true });
      }
      return;
    }

    // SCENARIO C: Not logged in (Public User)
    if (!currentUser) {
      // If trying to access protected Admin routes
      if (isAdminRoute && !isAuthPage) {
        navigate('/login', { replace: true, state: { from: location } });
      }
    }

  }, [isLoading, currentUser, isAdmin, location.pathname, navigate, toast]);

  // 3. RENDER UI
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-school-blue mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 font-medium">Verifying security status...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Only show timeout warning if logged in */}
      {currentUser && <SessionTimeoutWarning />}
    </>
  );
};

export default RouteProtection;