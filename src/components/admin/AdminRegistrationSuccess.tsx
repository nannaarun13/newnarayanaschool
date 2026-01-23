
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminRegistrationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-blue-light to-school-orange-light p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Request Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your admin access request has been submitted successfully. You will be able to log in once your request is reviewed and approved by the administrator.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full bg-school-blue hover:bg-school-blue/90">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRegistrationSuccess;
