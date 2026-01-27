import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/useAuth'; // ✅ IMPORTANT

// Managers
import ContentManager from '@/components/admin/ContentManager';
import GalleryManager from '@/components/admin/GalleryManager';
import NoticeBoardManager from '@/components/admin/NoticeBoardManager';
import AdmissionManager from '@/components/admin/AdmissionManager';
import ContactManager from '@/components/admin/ContactManager';
import AdminRequestManager from '@/components/admin/AdminRequestManager';

// Security
import SecurityHeadersEnhanced from '@/components/security/SecurityHeadersEnhanced';
import SecurityMetricsDashboard from '@/components/security/SecurityMetricsDashboard';
import SecurityMonitorEnhanced from '@/components/security/SecurityMonitorEnhanced';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("content");
  const navigate = useNavigate();
  const { toast } = useToast();

  // 🔐 AUTH STATE
  const { user, loading } = useAuth();

  // ⛔ BLOCK until auth ready
  if (loading) {
    return null;
  }

  // 🚫 NO USER → LOGIN
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleViewSite = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SecurityHeadersEnhanced />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold text-school-blue mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your school's content and settings
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <SyncStatusIndicator />
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleViewSite}>
                <Home className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex min-w-max lg:grid lg:grid-cols-7">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="admissions">Admissions</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="content"><ContentManager /></TabsContent>
          <TabsContent value="gallery"><GalleryManager /></TabsContent>
          <TabsContent value="notices"><NoticeBoardManager /></TabsContent>
          <TabsContent value="admissions"><AdmissionManager /></TabsContent>
          <TabsContent value="contact"><ContactManager /></TabsContent>
          <TabsContent value="requests"><AdminRequestManager /></TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityMetricsDashboard />
            <SecurityMonitorEnhanced />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminDashboard;
