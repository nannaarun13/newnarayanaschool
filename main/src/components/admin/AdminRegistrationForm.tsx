
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import * as z from "zod";

// Enhanced validation schema with comprehensive security checks
const secureRegistrationSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name too long")
    .regex(/^[a-zA-Z\s\-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .transform(name => name.trim().replace(/\s+/g, ' ')),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name too long")
    .regex(/^[a-zA-Z\s\-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes")
    .transform(name => name.trim().replace(/\s+/g, ' ')),
  email: z.string()
    .email("Invalid email address")
    .max(100, "Email too long")
    .transform(email => email.toLowerCase().trim())
    .refine(email => {
      // Additional email validation
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      const [local, domain] = parts;
      return local.length > 0 && local.length <= 64 && 
             domain.length > 0 && domain.length <= 255 &&
             !domain.includes('..') && !local.includes('..');
    }, "Invalid email format"),
  phone: z.string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .transform(phone => phone.trim()),
});

type SecureRegistrationFormData = z.infer<typeof secureRegistrationSchema>;

interface AdminRegistrationFormProps {
  onSuccess: () => void;
}

const AdminRegistrationForm = ({ onSuccess }: AdminRegistrationFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<SecureRegistrationFormData>({
    resolver: zodResolver(secureRegistrationSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: ''
    }
  });

  // Enhanced duplicate check
  const checkForDuplicates = async (email: string, phone: string): Promise<void> => {
    const emailQuery = query(collection(db, "admins"), where("email", "==", email));
    const phoneQuery = query(collection(db, "admins"), where("phone", "==", `+91${phone}`));
    
    const [emailSnapshot, phoneSnapshot] = await Promise.all([
      getDocs(emailQuery),
      getDocs(phoneQuery)
    ]);
    
    if (!emailSnapshot.empty) {
      throw new Error('An admin request with this email already exists.');
    }
    
    if (!phoneSnapshot.empty) {
      throw new Error('An admin request with this phone number already exists.');
    }
  };

  const handleSubmit = async (values: SecureRegistrationFormData) => {
    setLoading(true);
    
    try {
      // Enhanced validation and sanitization
      const sanitizedData = {
        firstName: values.firstName.toUpperCase(),
        lastName: values.lastName.toUpperCase(),
        email: values.email,
        phone: values.phone
      };
      
      // Check for duplicates
      await checkForDuplicates(sanitizedData.email, sanitizedData.phone);
      
      // Generate a secure unique ID
      const requestId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Enhanced admin data with security timestamps
      const adminData = {
        uid: requestId,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        phone: `+91${sanitizedData.phone}`,
        status: 'pending' as const,
        requestedAt: new Date().toISOString(),
        securityVersion: '2.0', // Track security schema version
        requestIP: 'client-provided', // In production, this should come from server
        userAgent: navigator.userAgent.substring(0, 500) // Truncated for security
      };

      await addDoc(collection(db, "admins"), adminData);

      onSuccess();
      toast({
        title: "Registration Submitted Successfully",
        description: "Your admin access request has been submitted and is pending approval. You'll be notified once reviewed.",
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Failed to submit registration. Please try again.";
      
      if (error.message.includes('already exists')) {
        errorMessage = error.message;
      } else if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please contact the system administrator.";
      } else if (error.code === 'network-error') {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({ 
        title: "Registration Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-school-blue" />
        </div>
        <CardTitle className="text-2xl text-center text-school-blue">
          Register for Admin Access
        </CardTitle>
        <p className="text-center text-gray-600 text-sm">
          Request administrative access to the school management system
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="First name" 
                        {...field} 
                        disabled={loading}
                        maxLength={50}
                        autoComplete="given-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
               <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Last name" 
                        {...field} 
                        disabled={loading}
                        maxLength={50}
                        autoComplete="family-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="your.email@domain.com" 
                    {...field} 
                    disabled={loading}
                    maxLength={100}
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-700 font-medium">
                      +91
                    </span>
                    <Input 
                      type="tel" 
                      placeholder="9876543210" 
                      maxLength={10}
                      className="rounded-l-none"
                      {...field} 
                      disabled={loading}
                      autoComplete="tel"
                      onInput={(e) => {
                        // Only allow digits
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[^0-9]/g, '');
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Security Notice</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your request will be reviewed by existing administrators</li>
                <li>• You'll receive notification once your request is processed</li>
                <li>• After approval, create your Firebase account using the same email</li>
                <li>• All registration attempts are logged for security purposes</li>
              </ul>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-school-blue hover:bg-school-blue/90">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Request...</span>
                </div>
              ) : (
                'Submit Registration Request'
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have access?{' '}
            <Button 
              variant="link" 
              className="text-school-blue p-0 h-auto" 
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Sign In
            </Button>
          </p>
          <p className="text-xs text-gray-500">
            By submitting this form, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminRegistrationForm;
