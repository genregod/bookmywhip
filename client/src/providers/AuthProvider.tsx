import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import LoadingIndicator from '@/components/shared/LoadingIndicator';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isVerified, setIsVerified] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check verification status when user is loaded
  useEffect(() => {
    if (!isLoading && user) {
      // For now, just mark as verified, but later will check against the server
      setIsVerified(true);
      setIsInitializing(false);
    } else if (!isLoading) {
      setIsInitializing(false);
    }
  }, [user, isLoading]);

  const value = {
    isAuthenticated: !!user,
    isLoading: isLoading || isInitializing,
    isVerified
  };

  if (isInitializing) {
    return <LoadingIndicator message="Initializing BookMyWhip..." />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}