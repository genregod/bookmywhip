import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Shield } from 'lucide-react';

interface IdentityVerificationProps {
  onComplete: () => void;
}

// Define a verification status type
type VerificationStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

const idSchema = z.object({
  documentType: z.enum(['passport', 'driving_license', 'id_card'], {
    required_error: 'Please select a document type',
  }),
});

type IdentityFormValues = z.infer<typeof idSchema>;

export default function IdentityVerification({ onComplete }: IdentityVerificationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('id');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  
  const form = useForm<IdentityFormValues>({
    resolver: zodResolver(idSchema),
    defaultValues: {
      documentType: 'id_card',
    },
  });

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelfieFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: IdentityFormValues) => {
    if (!documentFile) {
      toast({
        title: 'Document required',
        description: 'Please upload your identification document',
        variant: 'destructive',
      });
      return;
    }

    if (!selfieFile) {
      toast({
        title: 'Selfie required',
        description: 'Please upload a selfie photo for verification',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // In a real app, we would upload files to the server
      // For this demo, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the completion handler to move to the next step
      onComplete();
      
      toast({
        title: 'Documents submitted',
        description: 'Your identity documents have been submitted for verification',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your documents',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-center">Identity Verification</CardTitle>
        <CardDescription className="text-center">
          We need to verify your identity to comply with regulations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="id" onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="id">ID Document</TabsTrigger>
            <TabsTrigger value="selfie">Selfie Photo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="id" className="space-y-4">
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="id_card">National ID Card</option>
                      </select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel className="block">Upload Document</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {documentFile ? (
                      <div className="space-y-2">
                        <FileText className="h-8 w-8 mx-auto text-primary" />
                        <p className="text-sm">{documentFile.name}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setDocumentFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                          JPG, PNG or PDF (max. 5MB)
                        </p>
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleDocumentUpload}
                          accept=".jpg,.jpeg,.png,.pdf"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="selfie" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Please take a photo of yourself holding your ID document clearly visible beside your face.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {selfieFile ? (
                  <div className="space-y-2">
                    <div className="relative w-32 h-32 mx-auto">
                      <img 
                        src={URL.createObjectURL(selfieFile)} 
                        alt="Selfie preview" 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    </div>
                    <p className="text-sm">{selfieFile.name}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelfieFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Click to upload or take a photo
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG or PNG (max. 5MB)
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleSelfieUpload}
                      accept=".jpg,.jpeg,.png"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || !documentFile || !selfieFile}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Documents'}
        </Button>
      </CardFooter>
    </Card>
  );
}