
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SchoolContextProvider } from "./contexts/SchoolContext";
import RouteProtection from "./components/RouteProtection";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import Admissions from "./pages/Admissions";
import Gallery from "./pages/Gallery";
import NoticeBoard from "./pages/NoticeBoard";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRegistration from "./pages/admin/AdminRegistration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SchoolContextProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteProtection>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="about" element={<About />} />
                <Route path="admissions" element={<Admissions />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="notice-board" element={<NoticeBoard />} />
                <Route path="contact" element={<Contact />} />
                <Route path="login" element={<Login />} />
                <Route path="admin/register" element={<AdminRegistration />} />
                <Route path="admin/*" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteProtection>
        </BrowserRouter>
      </SchoolContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
