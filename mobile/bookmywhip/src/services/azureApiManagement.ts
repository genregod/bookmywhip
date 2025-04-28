/**
 * Azure API Management service integration
 * This service handles API access through Azure API Management
 */

import axios from 'axios';
import { API_CONFIG } from '../utils/config';

// API statistics interface
export interface ApiStatistics {
  apiId: string;
  apiName: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  avgLatency: number; // milliseconds
  p95Latency: number; // 95th percentile latency in milliseconds
  timeframe: string; // e.g., "last24h", "lastWeek"
}

// Azure API Management service interface
class AzureApiManagementService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api/azure/apim`;
  }

  /**
   * Get list of registered APIs
   * @returns List of API details
   */
  async getApis(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/apis`);
      return response.data;
    } catch (error) {
      console.error('Error getting APIs:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific API
   * @param apiId API ID
   * @returns API analytics data
   */
  async getApiAnalytics(apiId: string): Promise<ApiStatistics> {
    try {
      const response = await axios.get(`${this.baseUrl}/analytics/${apiId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting API analytics:', error);
      throw error;
    }
  }

  /**
   * Get overall API status
   * @returns API status information
   */
  async getApiStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unavailable';
    message: string;
    timestamp: string;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting API status:', error);
      // If we can't reach the status endpoint, return unavailable
      return {
        status: 'unavailable',
        message: 'Unable to connect to API status service',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Register a device for API access
   * @param deviceInfo Device information for registration
   * @returns Registration result including API token
   */
  async registerDevice(deviceInfo: {
    deviceId: string;
    platform: 'ios' | 'android';
    osVersion: string;
    appVersion: string;
  }): Promise<{
    deviceId: string;
    apiToken: string;
    expiresAt: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/register-device`, deviceInfo);
      return response.data;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  }

  /**
   * Refresh API token
   * @param refreshToken Refresh token
   * @returns New API token
   */
  async refreshApiToken(refreshToken: string): Promise<{
    apiToken: string;
    expiresAt: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/refresh-token`, {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      console.error('Error refreshing API token:', error);
      throw error;
    }
  }
}

export default new AzureApiManagementService();