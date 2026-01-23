import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { handleForgotPassword, forgotPasswordSchema } from '@/utils/authUtils';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setError(null);
    try {
      await handleForgotPassword(values);
      setSuccess(true);
    } catch (err: any) {
      // If the domain is not whitelisted in Firebase, this error appears
      if (err.code === 'auth/unauthorized-domain') {
        setError("Domain not authorized. Add 'new-narayana-school.vercel.app' to Firebase Auth Settings.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Check your inbox</h3>
        <p className="text-sm text-gray-600">
          We have sent a password reset link to <strong>{form.getValues('email')}</strong>.
        </p>
        <Button onClick={onBackToLogin} className="w-full bg-school-blue">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="reset-email">Email Address</Label>
        <Input 
          id="reset-email" 
          type="email" 
          placeholder="Enter your registered email" 
          {...form.register('email')} 
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-school-orange hover:bg-school-orange/90" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
      </Button>

      <Button type="button" variant="ghost" className="w-full" onClick={onBackToLogin}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;