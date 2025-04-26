import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LoadingIndicator from '@/components/shared/LoadingIndicator';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
}

export default function PhoneVerification({ phoneNumber, onVerified }: PhoneVerificationProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      toast({
        title: 'Verification failed',
        description: 'Please enter the verification code sent to your phone',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await apiRequest('POST', '/api/verify-phone', { code });
      if (res.ok) {
        toast({
          title: 'Phone verified',
          description: 'Your phone number has been successfully verified!',
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
      const res = await apiRequest('POST', '/api/resend-verification-sms');
      if (res.ok) {
        toast({
          title: 'Verification SMS sent',
          description: `A new verification code has been sent to ${phoneNumber}`,
        });
      } else {
        const error = await res.json();
        toast({
          title: 'Failed to resend SMS',
          description: error.message || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to resend SMS',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Verifying your phone number..." />;
  }

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Verify Your Phone</CardTitle>
        <CardDescription>
          We've sent a verification code to <span className="font-medium">{phoneNumber}</span>. 
          Please enter the 6-digit code below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="code"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full">Verify Phone</Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Didn't receive the SMS?
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