import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
}

const verificationSchema = z.object({
  code: z.string().length(6, { message: 'Verification code must be 6 digits' })
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

export default function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  
  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: ''
    }
  });

  const onSubmit = async (data: VerificationFormValues) => {
    try {
      // In a real app, we would validate the code with an API call
      // For this demo, we'll just accept any 6-digit code
      
      // For demo purposes, let's assume 123456 is the valid code
      if (data.code === '123456') {
        onVerified();
        toast({
          title: 'Email verified',
          description: 'Your email has been successfully verified',
        });
      } else {
        toast({
          title: 'Invalid code',
          description: 'Please enter the correct verification code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'There was an error verifying your email',
        variant: 'destructive',
      });
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      // In a real app, we would call an API to resend the code
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: 'Code resent',
        description: 'A new verification code has been sent to your email',
      });
    } catch (error) {
      toast({
        title: 'Failed to resend code',
        description: 'There was an error sending a new code',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-center">Email Verification</CardTitle>
        <CardDescription className="text-center">
          We've sent a verification code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-digit code" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Verify Email
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          variant="link" 
          onClick={handleResendCode}
          disabled={isResending}
        >
          {isResending ? 'Sending...' : 'Resend Code'}
        </Button>
      </CardFooter>
    </Card>
  );
}