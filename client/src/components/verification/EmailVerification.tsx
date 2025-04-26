import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LoadingIndicator from '@/components/shared/LoadingIndicator';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
}

export default function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: 'Verification failed',
        description: 'Please enter the verification code from your email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await apiRequest('POST', '/api/verify-email', { token });
      if (res.ok) {
        toast({
          title: 'Email verified',
          description: 'Your email has been successfully verified!',
        });
        onVerified();
      } else {
        const error = await res.json();
        toast({
          title: 'Verification failed',
          description: error.message || 'Invalid or expired verification code',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      const res = await apiRequest('POST', '/api/resend-verification-email');
      if (res.ok) {
        toast({
          title: 'Verification email sent',
          description: `A new verification email has been sent to ${email}`,
        });
      } else {
        const error = await res.json();
        toast({
          title: 'Failed to resend email',
          description: error.message || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to resend email',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Verifying your email..." />;
  }

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a verification code to <span className="font-medium">{email}</span>. 
          Please check your inbox and enter the code below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="token"
                placeholder="Enter verification code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">Verify Email</Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Didn't receive the email?
        </p>
        <Button 
          variant="outline" 
          onClick={handleResend} 
          disabled={isResending}
        >
          {isResending ? 'Sending...' : 'Resend Code'}
        </Button>
      </CardFooter>
    </Card>
  );
}