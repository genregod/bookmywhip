import { Request, Response } from 'express';
import { azureApiManagement } from '../services/azureApiManagement';

/**
 * Initialize Azure API Management
 * 
 * This route initializes the Azure API Management client and returns the status.
 */
export async function initializeAzureApiManagement(req: Request, res: Response) {
  try {
    await azureApiManagement.initialize();
    return res.status(200).json({
      success: true,
      message: 'Azure API Management initialized successfully'
    });
  } catch (error: any) {
    console.error('Failed to initialize Azure API Management:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to initialize Azure API Management: ${error.message}`,
      error: error.message
    });
  }
}

/**
 * Get all APIs
 * 
 * This route returns all registered APIs in the API Management instance.
 */
export async function getAllApis(req: Request, res: Response) {
  try {
    const apis = await azureApiManagement.getAllApis();
    return res.status(200).json({
      success: true,
      apis
    });
  } catch (error: any) {
    console.error('Failed to get APIs:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to get APIs: ${error.message}`,
      error: error.message
    });
  }
}

/**
 * Register BookMyWhip APIs
 * 
 * This route registers the BookMyWhip APIs with API Management.
 */
export async function registerBookMyWhipApis(req: Request, res: Response) {
  try {
    await azureApiManagement.registerBookMyWhipApis();
    return res.status(200).json({
      success: true,
      message: 'BookMyWhip APIs registered successfully'
    });
  } catch (error: any) {
    console.error('Failed to register BookMyWhip APIs:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to register BookMyWhip APIs: ${error.message}`,
      error: error.message
    });
  }
}

/**
 * Apply standard policies
 * 
 * This route applies standard policies to all BookMyWhip APIs.
 */
export async function applyStandardPolicies(req: Request, res: Response) {
  try {
    await azureApiManagement.applyStandardPolicies();
    return res.status(200).json({
      success: true,
      message: 'Standard policies applied successfully'
    });
  } catch (error: any) {
    console.error('Failed to apply standard policies:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to apply standard policies: ${error.message}`,
      error: error.message
    });
  }
}

/**
 * Create or update API
 * 
 * This route creates or updates an API in API Management.
 */
export async function createOrUpdateApi(req: Request, res: Response) {
  try {
    const { apiId, apiName, apiPath, apiDescription } = req.body;
    
    if (!apiId || !apiName || !apiPath) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: apiId, apiName, or apiPath'
      });
    }
    
    const api = await azureApiManagement.createOrUpdateApi(
      apiId,
      apiName,
      apiPath,
      apiDescription || ''
    );
    
    return res.status(200).json({
      success: true,
      message: `API '${apiName}' created/updated successfully`,
      api
    });
  } catch (error: any) {
    console.error('Failed to create/update API:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to create/update API: ${error.message}`,
      error: error.message
    });
  }
}

/**
 * Get API analytics
 * 
 * This route returns analytics for a specific API.
 */
export async function getApiAnalytics(req: Request, res: Response) {
  try {
    const { apiId } = req.params;
    
    if (!apiId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: apiId'
      });
    }
    
    const analytics = await azureApiManagement.getApiAnalytics(apiId);
    
    return res.status(200).json({
      success: true,
      analytics
    });
  } catch (error: any) {
    console.error(`Failed to get analytics for API ${req.params.apiId}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to get analytics for API ${req.params.apiId}: ${error.message}`,
      error: error.message
    });
  }
}