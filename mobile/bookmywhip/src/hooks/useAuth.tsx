import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authAPI } from '../services/api';
import apimService from '../services/azureApiManagement';

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  role: 'rider' | 'driver' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Load user and token on startup
  useEffect(() => {
    const loadUserAndToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setAuthToken(token);
          await refreshUser();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndToken();
  }, []);

  // Register device with API Management when authenticated
  useEffect(() => {
    const registerDeviceWithAPIM = async () => {
      if (user && authToken) {
        try {
          // Get device information - in a real app, use device info library
          const deviceInfo = {
            deviceId: 'unique-device-id', // Use a real device ID in production
            platform: 'android' as const, // Detect actual platform
            osVersion: '13', // Get actual OS version
            appVersion: '1.0.0', // Get app version
          };

          // Register device with API Management
          const registration = await apimService.registerDevice(deviceInfo);
          
          // Store API token
          await AsyncStorage.setItem('apiToken', registration.apiToken);
          await AsyncStorage.setItem('apiTokenExpiry', registration.expiresAt);
          
          console.log('Device registered with API Management');
        } catch (error) {
          console.error('Error registering device with API Management:', error);
        }
      }
    };

    registerDeviceWithAPIM();
  }, [user, authToken]);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
      await AsyncStorage.removeItem('userToken');
      setUser(null);
      setAuthToken(null);
    }
  };

  // Login
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(username, password);
      
      // Mock token in response data - adjust based on your actual API response
      const token = response.data.token || 'mock-token';
      
      await AsyncStorage.setItem('userToken', token);
      setAuthToken(token);
      setUser(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      // Mock token in response data - adjust based on your actual API response
      const token = response.data.token || 'mock-token';
      
      await AsyncStorage.setItem('userToken', token);
      setAuthToken(token);
      setUser(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('apiToken');
      await AsyncStorage.removeItem('apiTokenExpiry');
      setUser(null);
      setAuthToken(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;