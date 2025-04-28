import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API calls - update this with your actual API URL
const BASE_URL = 'https://your-api-url.com';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization token to requests if available
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 responses (unauthorized)
    if (error.response && error.response.status === 401) {
      // Clear token on auth error
      await AsyncStorage.removeItem('userToken');
      
      // In a real app, you might want to redirect to login page here
      // using a navigation service or context
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (username: string, password: string) => 
    api.post('/api/login', { username, password }),
  
  register: (userData: any) => 
    api.post('/api/register', userData),
  
  logout: () => 
    api.post('/api/logout'),
  
  getCurrentUser: () => 
    api.get('/api/me'),
};

// Ride APIs
export const rideAPI = {
  getRides: (status?: string) => 
    api.get('/api/rides', { params: { status } }),
  
  getRideById: (id: number) => 
    api.get(`/api/rides/${id}`),
  
  createRide: (rideData: any) => 
    api.post('/api/rides', rideData),
  
  acceptRide: (id: number) => 
    api.post(`/api/rides/${id}/accept`),
  
  startRide: (id: number) => 
    api.post(`/api/rides/${id}/start`),
  
  completeRide: (id: number) => 
    api.post(`/api/rides/${id}/complete`),
  
  cancelRide: (id: number) => 
    api.post(`/api/rides/${id}/cancel`),
  
  rateRide: (id: number, rating: number, comment?: string) => 
    api.post(`/api/rides/${id}/rate`, { rating, comment }),
};

// User APIs
export const userAPI = {
  getUserProfile: (id: number) => 
    api.get(`/api/users/${id}`),
  
  updateUserProfile: (id: number, userData: any) => 
    api.patch(`/api/users/${id}`, userData),
};

// Audio & Soundtrack APIs
export const audioAPI = {
  getAudioPreferences: (userId: number) => 
    api.get(`/api/users/${userId}/audio-preferences`),
  
  updateAudioPreferences: (userId: number, preferences: any) => 
    api.post(`/api/users/${userId}/audio-preferences`, preferences),
  
  getRideSoundtrack: (rideId: number) => 
    api.get(`/api/rides/${rideId}/soundtrack`),
  
  generateSoundtrack: (rideId: number, options?: any) => 
    api.post(`/api/rides/${rideId}/generate-soundtrack`, options),
};

// Payment APIs
export const paymentAPI = {
  createSetupIntent: () => 
    api.post('/api/setup-intent'),
  
  getPaymentMethods: () => 
    api.get('/api/payment-methods'),
  
  addPaymentMethod: (paymentMethodId: string) => 
    api.post('/api/payment-methods', { paymentMethodId }),
  
  setDefaultPaymentMethod: (paymentMethodId: string) => 
    api.post(`/api/payment-methods/${paymentMethodId}/default`),
  
  deletePaymentMethod: (paymentMethodId: string) => 
    api.delete(`/api/payment-methods/${paymentMethodId}`),
  
  createPaymentIntent: (amount: number) => 
    api.post('/api/create-payment-intent', { amount }),
};

export default {
  auth: authAPI,
  ride: rideAPI,
  user: userAPI,
  audio: audioAPI,
  payment: paymentAPI,
};