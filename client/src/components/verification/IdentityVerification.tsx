import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LoadingIndicator from '@/components/shared/LoadingIndicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileCheck, FileQuestion, Upload } from 'lucide-react';

interface IdentityVerificationProps {
  onComplete: () => void;
}

type VerificationStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export default function IdentityVerification({ onComplete }: IdentityVerificationProps) {
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idFrontFile || !idBackFile || !selfieFile) {
      toast({
        title: 'Submission failed',
        description: 'Please upload all required documents',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('idFront', idFrontFile);
      formData.append('idBack', idBackFile);
      formData.append('selfie', selfieFile);
      
      const res = await fetch('/api/verify-identity', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (res.ok) {
        toast({
          title: 'Documents submitted',
          description: 'Your identity documents have been submitted for verification.',
        });
        setStatus('submitted');
        onComplete();
      } else {
        const error = await res.json();
        toast({
          title: 'Submission failed',
          description: error.message || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsLoading(true);
    
    try {
      const res = await apiRequest('GET', '/api/identity-verification-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        
        if (data.status === 'verified') {
          toast({
            title: 'Identity verified',
            description: 'Your identity has been successfully verified!',
          });
          onComplete();
        } else if (data.status === 'rejected') {
          toast({
            title: 'Verification rejected',
            description: data.reason || 'Your identity verification was rejected. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        const error = await res.json();
        toast({
          title: 'Failed to check status',
          description: error.message || 'Something went wrong',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to check status',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Processing your request..." />;
  }

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Identity Verification</CardTitle>
        <CardDescription>
          Help us verify your identity by uploading the required documents.
          This helps ensure safety and compliance.
        </CardDescription>
      </CardHeader>
      
      {status === 'submitted' ? (
        <CardContent>
          <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 mb-4">
            <FileQuestion className="h-5 w-5" />
            <AlertTitle>Verification in progress</AlertTitle>
            <AlertDescription>
              Your documents have been submitted and are being reviewed. This process may take 24-48 hours.
            </AlertDescription>
          </Alert>
          <Button onClick={handleCheckStatus} className="w-full">
            Check Verification Status
          </Button>
        </CardContent>
      ) : status === 'verified' ? (
        <CardContent>
          <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 mb-4">
            <FileCheck className="h-5 w-5" />
            <AlertTitle>Verification complete</AlertTitle>
            <AlertDescription>
              Your identity has been successfully verified. You now have full access to all features.
            </AlertDescription>
          </Alert>
          <Button onClick={onComplete} className="w-full">
            Continue
          </Button>
        </CardContent>
      ) : status === 'rejected' ? (
        <CardContent>
          <Alert className="bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 mb-4">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Verification rejected</AlertTitle>
            <AlertDescription>
              Your identity verification was unsuccessful. Please resubmit clearer documents.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="idFront">Front of ID/Driver's License</Label>
                <Input
                  id="idFront"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="idBack">Back of ID/Driver's License</Label>
                <Input
                  id="idBack"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="selfie">Selfie with ID</Label>
                <Input
                  id="selfie"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Resubmit Documents
              </Button>
            </div>
          </form>
        </CardContent>
      ) : (
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="idFront">Front of ID/Driver's License</Label>
                <Input
                  id="idFront"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="idBack">Back of ID/Driver's License</Label>
                <Input
                  id="idBack"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="selfie">Selfie with ID</Label>
                <Input
                  id="selfie"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Submit Documents
              </Button>
            </div>
          </form>
        </CardContent>
      )}
      
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Your information is encrypted and secure. We comply with all data protection regulations.
      </CardFooter>
    </Card>
  );
}