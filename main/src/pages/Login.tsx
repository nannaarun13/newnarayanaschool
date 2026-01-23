import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

type LoginMode = 'login' | 'forgot-password';

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-school-blue-light to-school-orange-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-school-blue mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-school-blue mb-2">
            {mode === 'login' ? 'Admin Login' : 'Reset Password'}
          </h1>
          <p className="text-gray-600">New Narayana School Admin Panel</p>
        </div>
        
        <Card className="shadow-lg border-t-4 border-t-school-blue">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-school-blue">
              {mode === 'login' ? 'Sign In' : 'Password Recovery'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'login' ? (
              <LoginForm
                onForgotPassword={() => setMode('forgot-password')}
                onRegisterClick={() => navigate('/admin/register')}
                onHomeClick={() => navigate('/')}
              />
            ) : (
              <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;