/**
 * Driver Onboarding Routes
 * 
 * These routes handle the driver onboarding process, including:
 * - Basic information collection
 * - Document upload
 * - Background check initiation with Checkr
 * - Profile approval
 */

import express, { Request, Response } from 'express';
import { db } from '../db';
import { users, vehicles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { checkrService } from '../services/checkrService';

const router = express.Router();

// Driver onboarding steps enum for better readability
enum DriverOnboardingStep {
  BASIC_INFO = 1,
  VEHICLE_INFO = 2,
  DOCUMENT_UPLOAD = 3,
  BACKGROUND_CHECK = 4,
  REVIEW = 5,
  COMPLETED = 6
}

/**
 * Get driver onboarding status
 */
router.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Additional data based on current step
    let additionalData = {};
    
    if (user.driverOnboardingStep === DriverOnboardingStep.VEHICLE_INFO || 
        user.driverOnboardingStep > DriverOnboardingStep.VEHICLE_INFO) {
      const userVehicles = await db.select().from(vehicles).where(eq(vehicles.driverId, userId));
      additionalData = { ...additionalData, vehicles: userVehicles };
    }
    
    if (user.driverOnboardingStep === DriverOnboardingStep.BACKGROUND_CHECK || 
        user.driverOnboardingStep > DriverOnboardingStep.BACKGROUND_CHECK) {
      if (user.checkrCandidateId) {
        try {
          const candidate = await checkrService.getCandidate(user.checkrCandidateId);
          additionalData = { ...additionalData, backgroundCheck: { candidate } };
          
          if (user.backgroundCheckReportId) {
            const report = await checkrService.getReport(user.backgroundCheckReportId);
            additionalData = { 
              ...additionalData, 
              backgroundCheck: { 
                ...additionalData.backgroundCheck, 
                report 
              } 
            };
          }
        } catch (error) {
          console.error('Error fetching Checkr data:', error);
        }
      }
    }
    
    return res.status(200).json({
      userId: user.id,
      currentStep: user.driverOnboardingStep,
      isDriverApproved: user.isDriverApproved,
      steps: {
        1: { name: 'Basic Information', completed: user.driverOnboardingStep > DriverOnboardingStep.BASIC_INFO },
        2: { name: 'Vehicle Information', completed: user.driverOnboardingStep > DriverOnboardingStep.VEHICLE_INFO },
        3: { name: 'Document Upload', completed: user.driverOnboardingStep > DriverOnboardingStep.DOCUMENT_UPLOAD },
        4: { name: 'Background Check', completed: user.driverOnboardingStep > DriverOnboardingStep.BACKGROUND_CHECK },
        5: { name: 'Review', completed: user.driverOnboardingStep > DriverOnboardingStep.REVIEW },
        6: { name: 'Completed', completed: user.driverOnboardingStep === DriverOnboardingStep.COMPLETED }
      },
      backgroundCheckStatus: user.backgroundCheckStatus,
      ...additionalData
    });
  } catch (error) {
    console.error('Error getting driver onboarding status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update driver basic information (Step 1)
 */
router.post('/basic-info/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { firstName, lastName, email, phoneNumber } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !phoneNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        email,
        phoneNumber,
        role: 'driver',
        driverOnboardingStep: DriverOnboardingStep.VEHICLE_INFO
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      message: 'Basic information updated successfully',
      nextStep: DriverOnboardingStep.VEHICLE_INFO,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating driver basic information:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Add driver vehicle information (Step 2)
 */
router.post('/vehicle-info/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { make, model, year, color, licensePlate, type } = req.body;
    
    // Validation
    if (!make || !model || !year || !color || !licensePlate || !type) {
      return res.status(400).json({ message: 'All vehicle fields are required' });
    }
    
    // Get user to check current step
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add vehicle
    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        driverId: userId,
        make,
        model,
        year,
        color,
        licensePlate,
        type,
        isActive: true
      })
      .returning();
    
    // Update user's onboarding step
    const [updatedUser] = await db
      .update(users)
      .set({
        driverOnboardingStep: DriverOnboardingStep.DOCUMENT_UPLOAD
      })
      .where(eq(users.id, userId))
      .returning();
    
    return res.status(201).json({
      message: 'Vehicle information added successfully',
      nextStep: DriverOnboardingStep.DOCUMENT_UPLOAD,
      vehicle: newVehicle,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error adding driver vehicle information:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Upload driver documents (Step 3)
 */
router.post('/documents/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { driverLicenseNumber, driverLicenseState, driverLicenseExpiry, documents } = req.body;
    
    // Validation
    if (!driverLicenseNumber || !driverLicenseState || !driverLicenseExpiry) {
      return res.status(400).json({ message: 'All driver license fields are required' });
    }
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: 'Documents are required' });
    }
    
    // Get user to check current step
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user with document info
    const [updatedUser] = await db
      .update(users)
      .set({
        driverLicenseNumber,
        driverLicenseState,
        driverLicenseExpiry: new Date(driverLicenseExpiry),
        identityDocuments: documents,
        identityVerificationStatus: 'submitted',
        driverOnboardingStep: DriverOnboardingStep.BACKGROUND_CHECK
      })
      .where(eq(users.id, userId))
      .returning();
    
    return res.status(200).json({
      message: 'Documents uploaded successfully',
      nextStep: DriverOnboardingStep.BACKGROUND_CHECK,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading driver documents:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Start background check with Checkr (Step 4)
 */
router.post('/background-check/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { ssn, dob, zipcode } = req.body;
    
    // Validation
    if (!ssn || !dob || !zipcode) {
      return res.status(400).json({ message: 'SSN, DOB, and zipcode are required' });
    }
    
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.firstName || !user.lastName || !user.email) {
      return res.status(400).json({ message: 'User must complete basic information first' });
    }
    
    // Create Checkr candidate
    const candidate = await checkrService.createCandidate({
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      zipcode,
      dob,
      ssn,
      driver_license_number: user.driverLicenseNumber,
      driver_license_state: user.driverLicenseState
    });
    
    // Create background check
    const report = await checkrService.createBackgroundCheck(candidate.id, 'driver_pro');
    
    // Update user with Checkr info
    const [updatedUser] = await db
      .update(users)
      .set({
        checkrCandidateId: candidate.id,
        backgroundCheckStatus: 'pending',
        backgroundCheckReportId: report.id,
        driverOnboardingStep: DriverOnboardingStep.REVIEW
      })
      .where(eq(users.id, userId))
      .returning();
    
    return res.status(200).json({
      message: 'Background check initiated successfully',
      nextStep: DriverOnboardingStep.REVIEW,
      backgroundCheck: {
        candidate,
        report
      },
      user: updatedUser
    });
  } catch (error) {
    console.error('Error initiating background check:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create a background check invitation link
 */
router.post('/background-check-invitation/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.checkrCandidateId) {
      return res.status(400).json({ message: 'User must be registered with Checkr first' });
    }
    
    // Create invitation
    const invitation = await checkrService.createInvitation(user.checkrCandidateId, 'driver_pro');
    
    // Update user with invitation info
    const [updatedUser] = await db
      .update(users)
      .set({
        backgroundCheckInvitationId: invitation.id,
        backgroundCheckInvitationUrl: invitation.invitation_url
      })
      .where(eq(users.id, userId))
      .returning();
    
    return res.status(200).json({
      message: 'Background check invitation created successfully',
      invitation,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error creating background check invitation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Checkr webhook endpoint to receive background check results
 */
router.post('/checkr-webhook', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    // Process different event types
    if (type === 'report.completed') {
      const reportId = data.id;
      const report = await checkrService.getReport(reportId);
      
      // Find user with this report ID
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.backgroundCheckReportId, reportId));
      
      if (!user) {
        return res.status(404).json({ message: 'User not found for this report' });
      }
      
      // Update user based on report status
      let isApproved = false;
      if (report.status === 'clear') {
        isApproved = true;
      }
      
      await db
        .update(users)
        .set({
          backgroundCheckStatus: report.status,
          backgroundCheckCompletedAt: new Date(),
          isDriverApproved: isApproved,
          driverOnboardingStep: isApproved ? DriverOnboardingStep.COMPLETED : DriverOnboardingStep.REVIEW
        })
        .where(eq(users.id, user.id));
    }
    
    return res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing Checkr webhook:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get Checkr publishable key for frontend
 */
router.get('/checkr-publishable-key', (req: Request, res: Response) => {
  try {
    const publishableKey = checkrService.getPublishableKey();
    return res.status(200).json({ publishableKey });
  } catch (error) {
    console.error('Error getting Checkr publishable key:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Admin: Manually approve a driver
 */
router.post('/admin/approve-driver/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { approved, adminNotes } = req.body;
    
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user approval status
    const [updatedUser] = await db
      .update(users)
      .set({
        isDriverApproved: approved,
        driverOnboardingStep: approved ? DriverOnboardingStep.COMPLETED : DriverOnboardingStep.REVIEW,
        // Store admin notes in a proper field if you add one to the schema
      })
      .where(eq(users.id, userId))
      .returning();
    
    return res.status(200).json({
      message: `Driver ${approved ? 'approved' : 'rejected'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error approving/rejecting driver:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;