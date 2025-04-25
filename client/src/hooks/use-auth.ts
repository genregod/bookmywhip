import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export type User = {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: 'rider' | 'driver' | 'admin';
  avatar?: string;
  rating?: number;
  createdAt?: string;
};

interface RegisterData {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: 'rider' | 'driver';
}

interface LoginData {
  username: string;
  password: string;
}

interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query current user
  const { 
    data: user, 
    isLoading,
    isError 
  } = useQuery<User | null>({ 
    queryKey: ['/api/me'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      await apiRequest('POST', '/api/register', data);
    },
    onSuccess: () => {
      toast({
        title: 'Registration successful',
        description: 'Please log in with your new account',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest('POST', '/api/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/me'], data);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.username}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid username or password',
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('GET', '/api/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/me'], null);
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Logout failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user) throw new Error('Not authenticated');
      const response = await apiRequest('PATCH', `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/me'], data);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const register = useCallback(async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const login = useCallback(async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  }, [loginMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    await updateProfileMutation.mutateAsync(data);
  }, [updateProfileMutation]);

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };
}
