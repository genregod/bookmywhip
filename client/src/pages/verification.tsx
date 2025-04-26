import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import MainLayout from '@/components/layout/MainLayout';
import EmailVerification from '@/components/verification/EmailVerification';
import PhoneVerification from '@/components/verification/PhoneVerification';
import IdentityVerification from '@/components/verification/IdentityVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type VerificationStep = 'email' | 'phone' | 'identity' | 'complete';

export default function VerificationPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('email');
  const [isRetrievingStatus, setIsRetrievingStatus] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchVerificationStatus();
    }
  }, [user, isLoading, navigate]);

  const fetchVerificationStatus = async () => {
    setIsRetrievingStatus(true);
    try {
      const res = await apiRequest('GET', '/api/verification-status');
      if (res.ok) {
        const data = await res.json();
        
        // Determine which step to show
        if (!data.isEmailVerified) {
          setCurrentStep('email');
        } else if (!data.isPhoneVerified) {
          setCurrentStep('phone');
        } else if (!data.isIdentityVerified) {
          setCurrentStep('identity');
        } else {
          setCurrentStep('complete');
        }
      } else {
        // Default to first step if we can't get status
        setCurrentStep('email');
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setCurrentStep('email');
    } finally {
      setIsRetrievingStatus(false);
    }
  };

  const handleEmailVerified = () => {
    setCurrentStep('phone');
  };

  const handlePhoneVerified = () => {
    setCurrentStep('identity');
  };

  const handleIdentityVerified = () => {
    setCurrentStep('complete');
  };

  const handleContinue = () => {
    navigate('/');
  };

  // Show loading indicator while checking authentication and verification status
  if (isLoading || isRetrievingStatus) {
    return <LoadingIndicator message="Loading verification status..." />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Account Verification</h1>
          
          <div className="flex justify-center mb-8 w-full">
            <div className="flex items-center w-full max-w-xl">
              <div className={`flex flex-col items-center ${currentStep === 'email' ? 'text-primary' : (currentStep === 'phone' || currentStep === 'identity' || currentStep === 'complete') ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 'email' ? 'bg-primary' : (currentStep === 'phone' || currentStep === 'identity' || currentStep === 'complete') ? 'bg-green-500' : 'bg-gray-200'} text-white mb-2`}>
                  {(currentStep === 'phone' || currentStep === 'identity' || currentStep === 'complete') ? <CheckCircle2 className="h-6 w-6" /> : '1'}
                </div>
                <span className="text-sm">Email</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${(currentStep === 'phone' || currentStep === 'identity' || currentStep === 'complete') ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              
              <div className={`flex flex-col items-center ${currentStep === 'phone' ? 'text-primary' : (currentStep === 'identity' || currentStep === 'complete') ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 'phone' ? 'bg-primary' : (currentStep === 'identity' || currentStep === 'complete') ? 'bg-green-500' : 'bg-gray-200'} text-white mb-2`}>
                  {(currentStep === 'identity' || currentStep === 'complete') ? <CheckCircle2 className="h-6 w-6" /> : '2'}
                </div>
                <span className="text-sm">Phone</span>
              </div>
              
              <div className={`flex-1 h-1 mx-2 ${(currentStep === 'identity' || currentStep === 'complete') ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              
              <div className={`flex flex-col items-center ${currentStep === 'identity' ? 'text-primary' : currentStep === 'complete' ? 'text-green-500' : 'text-gray-400'}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 'identity' ? 'bg-primary' : currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-200'} text-white mb-2`}>
                  {currentStep === 'complete' ? <CheckCircle2 className="h-6 w-6" /> : '3'}
                </div>
                <span className="text-sm">Identity</span>
              </div>
            </div>
          </div>
          
          {currentStep === 'email' && user?.email && (
            <EmailVerification 
              email={user.email} 
              onVerified={handleEmailVerified} 
            />
          )}
          
          {currentStep === 'phone' && user?.phoneNumber && (
            <PhoneVerification 
              phoneNumber={user.phoneNumber} 
              onVerified={handlePhoneVerified} 
            />
          )}
          
          {currentStep === 'identity' && (
            <IdentityVerification 
              onComplete={handleIdentityVerified} 
            />
          )}
          
          {currentStep === 'complete' && (
            <Card className="max-w-md w-full mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Verification Complete!</CardTitle>
                <CardDescription className="text-center">
                  Thank you for verifying your account. You now have full access to all BookMyWhip features.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <Button onClick={handleContinue} className="w-full">
                  Continue to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}