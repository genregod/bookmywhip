/**
 * Checkr Background Check Service
 * 
 * This service handles integration with the Checkr API for performing background checks on drivers.
 * It uses the Checkr API to create and manage candidates, background checks, and reports.
 */

import axios from 'axios';

// Configuration
const CHECKR_API_URL = 'https://api.checkr.com/v1';
const CHECKR_SECRET_KEY = process.env.CHECKR_SECRET_KEY;
const CHECKR_PUBLISHABLE_KEY = process.env.CHECKR_PUBLISHABLE_KEY;

// Types for Checkr entities
export interface CheckrCandidate {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  zipcode?: string;
  dob?: string;
  ssn?: string;
  driver_license_number?: string;
  driver_license_state?: string;
}

export interface CheckrReport {
  id: string;
  object: string;
  uri: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  turnaround_time: number | null;
  package: string;
  candidate_id: string;
  screenings: any[];
}

export interface CheckrInvitation {
  id: string;
  status: string;
  invitation_url: string;
  completed_at: string | null;
  expires_at: string;
  candidate_id: string;
}

/**
 * Service class for handling Checkr API interactions
 */
class CheckrService {
  private api;

  constructor() {
    this.api = axios.create({
      baseURL: CHECKR_API_URL,
      auth: {
        username: CHECKR_SECRET_KEY as string,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Creates a new candidate in the Checkr system
   * @param candidateData The candidate data to create
   * @returns The created candidate
   */
  async createCandidate(candidateData: CheckrCandidate) {
    try {
      const response = await this.api.post('/candidates', candidateData);
      return response.data;
    } catch (error) {
      console.error('Error creating Checkr candidate:', error);
      throw error;
    }
  }

  /**
   * Retrieves a candidate from the Checkr system
   * @param candidateId The ID of the candidate to retrieve
   * @returns The candidate data
   */
  async getCandidate(candidateId: string) {
    try {
      const response = await this.api.get(`/candidates/${candidateId}`);
      return response.data;
    } catch (error) {
      console.error(`Error retrieving Checkr candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing candidate in the Checkr system
   * @param candidateId The ID of the candidate to update
   * @param candidateData The updated candidate data
   * @returns The updated candidate
   */
  async updateCandidate(candidateId: string, candidateData: Partial<CheckrCandidate>) {
    try {
      const response = await this.api.post(`/candidates/${candidateId}`, candidateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating Checkr candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a background check for a candidate
   * @param candidateId The ID of the candidate
   * @param packageName The name of the Checkr package to use
   * @returns The created report
   */
  async createBackgroundCheck(candidateId: string, packageName: string) {
    try {
      const response = await this.api.post('/reports', {
        candidate_id: candidateId,
        package: packageName
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating background check for candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a report from the Checkr system
   * @param reportId The ID of the report to retrieve
   * @returns The report data
   */
  async getReport(reportId: string) {
    try {
      const response = await this.api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error(`Error retrieving Checkr report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Creates an invitation for a candidate to complete their background check
   * @param candidateId The ID of the candidate
   * @param packageName The name of the Checkr package to use
   * @returns The created invitation
   */
  async createInvitation(candidateId: string, packageName: string) {
    try {
      const response = await this.api.post('/invitations', {
        candidate_id: candidateId,
        package: packageName
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating invitation for candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves an invitation from the Checkr system
   * @param invitationId The ID of the invitation to retrieve
   * @returns The invitation data
   */
  async getInvitation(invitationId: string) {
    try {
      const response = await this.api.get(`/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error retrieving Checkr invitation ${invitationId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the publishable API key for client-side use
   * @returns The publishable API key
   */
  getPublishableKey() {
    return CHECKR_PUBLISHABLE_KEY;
  }
}

export const checkrService = new CheckrService();
export default checkrService;