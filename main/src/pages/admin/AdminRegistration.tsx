import { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdminRegistrationForm from '@/components/admin/AdminRegistrationForm';
import AdminRegistrationSuccess from '@/components/admin/AdminRegistrationSuccess';

const AdminRegistration = () => {
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  if (submitted) {
    return <AdminRegistrationSuccess />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-blue-light to-school-orange-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-school-blue mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-school-blue mb-2">Admin Registration</h1>
          <p className="text-gray-600">Request access to the admin panel</p>
        </div>
        
        {/* The Registration Form */}
        <AdminRegistrationForm onSuccess={() => setSubmitted(true)} />

        {/* NEW: Back to Login Button */}
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-school-blue"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AdminRegistration;