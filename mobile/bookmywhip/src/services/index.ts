/**
 * Services export file
 * This file exports all service modules for easy importing
 */

import api from './api';
import azureMapsService from './azureMaps';
import realTimeTrackingService from './realTimeTracking';
import paymentService from './payment';
import azureApiManagementService from './azureApiManagement';
import soundtrackService from './soundtrack';

// Export individual services
export const apiService = api;
export const mapsService = azureMapsService;
export const trackingService = realTimeTrackingService;
export const paymentService = paymentService;
export const apimService = azureApiManagementService;
export const soundtrackService = soundtrackService;

// Export types from services
export * from './azureMaps';
export * from './realTimeTracking';
export * from './payment';
export * from './azureApiManagement';
export * from './soundtrack';

// Export default services object
export default {
  api,
  maps: azureMapsService,
  tracking: realTimeTrackingService,
  payment: paymentService,
  apim: azureApiManagementService,
  soundtrack: soundtrackService,
};