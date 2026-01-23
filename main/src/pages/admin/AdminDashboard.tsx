import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Import the managers
import ContentManager from '@/components/admin/ContentManager';
import GalleryManager from '@/components/admin/GalleryManager';
import NoticeBoardManager from '@/components/admin/NoticeBoardManager'; // <--- UPDATED THIS
import AdmissionManager from '@/components/admin/AdmissionManager';
import ContactManager from '@/components/admin/ContactManager';
import AdminRequestManager from '@/components/admin/AdminRequestManager';

// Import Security components
import SecurityHeadersEnhanced from '@/components/security/SecurityHeadersEnhanced';
import SecurityMetricsDashboard from '@/components/security/SecurityMetricsDashboard';
import SecurityMonitorEnhanced from '@/components/security/SecurityMonitorEnhanced';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("content");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Optional: Check if user is actually admin here
  }, []);

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
            <h1 className="text-3xl font-bold text-school-blue mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your school's content and settings</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <SyncStatusIndicator />
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleViewSite}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">View Site</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Scrollable Tabs List for mobile */}
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-full min-w-max lg:w-full lg:grid lg:grid-cols-7">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="admissions">Admissions</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="content" className="space-y-6">
              <ContentManager />
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <GalleryManager />
            </TabsContent>

            {/* UPDATED NOTICE MANAGER */}
            <TabsContent value="notices" className="space-y-6">
              <NoticeBoardManager />
            </TabsContent>

            <TabsContent value="admissions" className="space-y-6">
              <AdmissionManager />
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <ContactManager />
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              <AdminRequestManager />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecurityMetricsDashboard />
              <SecurityMonitorEnhanced />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default AdminDashboard;