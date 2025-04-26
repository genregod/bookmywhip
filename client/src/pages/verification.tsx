import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Stepper, Step } from '@/components/ui/stepper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import EmailVerification from '@/components/verification/EmailVerification';
import PhoneVerification from '@/components/verification/PhoneVerification';
import IdentityVerification from '@/components/verification/IdentityVerification';

// Define the verification steps
type VerificationStep = 'email' | 'phone' | 'identity' | 'complete';

export default function VerificationPage() {
  const [, navigate] = useLocation();
  const { user, isLoading, updateProfile } = useAuth();
  const [activeStep, setActiveStep] = useState<VerificationStep>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to home if already verified
  useEffect(() => {
    if (!isLoading && user) {
      const { isEmailVerified, isPhoneVerified, isIdentityVerified } = user;
      
      if (isEmailVerified && isPhoneVerified && isIdentityVerified) {
        navigate('/');
      } else if (isEmailVerified && isPhoneVerified) {
        setActiveStep('identity');
      } else if (isEmailVerified) {
        setActiveStep('phone');
      }
    }
  }, [user, isLoading, navigate]);

  const handleEmailVerified = async () => {
    setIsSubmitting(true);
    try {
      // Here we'd normally call an API to verify the email
      // For demo purposes, we'll just update the user object
      await updateProfile({ isEmailVerified: true });
      setActiveStep('phone');
    } catch (error) {
      console.error('Error verifying email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerified = async () => {
    setIsSubmitting(true);
    try {
      // Here we'd normally call an API to verify the phone
      await updateProfile({ isPhoneVerified: true });
      setActiveStep('identity');
    } catch (error) {
      console.error('Error verifying phone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdentityVerified = async () => {
    setIsSubmitting(true);
    try {
      // Here we'd normally call an API to verify identity documents
      await updateProfile({ isIdentityVerified: true });
      setActiveStep('complete');
    } catch (error) {
      console.error('Error verifying identity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    navigate('/');
  };

  // Show loading if user data is still loading
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingIndicator message="Loading verification..." />
      </MainLayout>
    );
  }

  // Render the appropriate verification step
  const renderStep = () => {
    if (!user) return null;

    switch (activeStep) {
      case 'email':
        return <EmailVerification email={user.email || ''} onVerified={handleEmailVerified} />;
      case 'phone':
        return <PhoneVerification phoneNumber={user.phoneNumber || ''} onVerified={handlePhoneVerified} />;
      case 'identity':
        return <IdentityVerification onComplete={handleIdentityVerified} />;
      case 'complete':
        return (
          <Card className="w-full max-w-md mx-auto mt-8">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <CardTitle className="text-center">Verification Complete</CardTitle>
              <CardDescription className="text-center">
                You have successfully completed all verification steps
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>Thank you for verifying your account. You can now use all features of BookMyWhip.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={handleComplete}>Go to Dashboard</Button>
            </CardFooter>
          </Card>
        );
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl p-4 md:p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Account Verification</h1>
          <p className="text-gray-600">Complete the following steps to verify your account</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Email step */}
            <div className="flex flex-col items-center w-1/4">
              <div className={`flex items-center justify-center rounded-full h-10 w-10 ${
                activeStep === 'email' ? 'bg-primary text-white' :
                activeStep === 'phone' || activeStep === 'identity' || activeStep === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {activeStep === 'phone' || activeStep === 'identity' || activeStep === 'complete' ? 
                  <CheckCircle size={16} /> : 1}
              </div>
              <div className="text-sm mt-2 text-center">Email</div>
            </div>
            
            {/* Line between steps */}
            <div className={`h-1 flex-1 ${
              activeStep === 'phone' || activeStep === 'identity' || activeStep === 'complete' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>
            
            {/* Phone step */}
            <div className="flex flex-col items-center w-1/4">
              <div className={`flex items-center justify-center rounded-full h-10 w-10 ${
                activeStep === 'phone' ? 'bg-primary text-white' :
                activeStep === 'identity' || activeStep === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {activeStep === 'identity' || activeStep === 'complete' ? 
                  <CheckCircle size={16} /> : 2}
              </div>
              <div className="text-sm mt-2 text-center">Phone</div>
            </div>
            
            {/* Line between steps */}
            <div className={`h-1 flex-1 ${
              activeStep === 'identity' || activeStep === 'complete' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>
            
            {/* Identity step */}
            <div className="flex flex-col items-center w-1/4">
              <div className={`flex items-center justify-center rounded-full h-10 w-10 ${
                activeStep === 'identity' ? 'bg-primary text-white' :
                activeStep === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {activeStep === 'complete' ? 
                  <CheckCircle size={16} /> : 3}
              </div>
              <div className="text-sm mt-2 text-center">Identity</div>
            </div>
            
            {/* Line between steps */}
            <div className={`h-1 flex-1 ${
              activeStep === 'complete' ? 'bg-green-500' : 'bg-gray-200'
            }`}></div>
            
            {/* Complete step */}
            <div className="flex flex-col items-center w-1/4">
              <div className={`flex items-center justify-center rounded-full h-10 w-10 ${
                activeStep === 'complete' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                4
              </div>
              <div className="text-sm mt-2 text-center">Complete</div>
            </div>
          </div>
        </div>

        {isSubmitting ? (
          <LoadingIndicator message="Processing..." />
        ) : (
          renderStep()
        )}
      </div>
    </MainLayout>
  );
}