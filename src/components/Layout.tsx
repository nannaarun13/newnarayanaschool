import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import { useSchool } from '@/contexts/SchoolContext';
// FIX: Use absolute import for safety and consistency
import SecurityHeadersEnhanced from '@/components/security/SecurityHeadersEnhanced';

const Layout = () => {
  const location = useLocation();
  const { dispatch } = useSchool();
  
  // Logic to hide public layout components
  const isAdminPage = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/login';
  
  useEffect(() => {
    // FIX: Always scroll to top when route changes (Critical for UX)
    window.scrollTo(0, 0);

    // Increment visitor count only on public pages
    if (!isAdminPage && !isLoginPage) {
      dispatch({ type: 'INCREMENT_VISITORS' });
    }
  }, [location.pathname, dispatch, isAdminPage, isLoginPage]);

  // 1. Admin & Login Layout (No Header/Footer)
  if (isAdminPage || isLoginPage) {
    return (
      <>
        <SecurityHeadersEnhanced />
        <div className="min-h-screen bg-gray-50">
          <Outlet />
        </div>
      </>
    );
  }

  // 2. Public Website Layout
  return (
    <>
      <SecurityHeadersEnhanced />
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <Navigation />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;