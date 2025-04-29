import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AuthPage from "@/pages/auth-page";
import Verification from "@/pages/verification";
import Profile from "@/pages/profile";
import Rides from "@/pages/rides";
import Payment from "@/pages/payment";
import Settings from "@/pages/settings";
import Earnings from "@/pages/earnings";
import Admin from "@/pages/admin";
import Demo from "@/pages/demo";
import SocketDemo from "@/pages/socket-demo";
import WazeDemoPage from "@/pages/waze-demo";
import NavigationDemo from "@/pages/navigation-demo";
import RoutePreviewDemo from "@/pages/route-preview-demo";
import RouteAnimationTest from "@/pages/route-animation-test";
import AzureMapsDemo from "@/pages/azure-maps-demo";
import RealTimeTrackingDemo from "@/pages/real-time-tracking-demo";
import AudioPreferencesPage from "@/pages/audio-preferences";
import RideSoundtrackPage from "@/pages/ride-soundtrack";
import SoundtrackDemoPage from "@/pages/soundtrack-demo";
import DriverOnboarding from "@/pages/driver-onboarding";

import { useAuth } from "@/hooks/use-auth";
import LoadingIndicator from "@/components/shared/LoadingIndicator";

// Protected route component
function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  
  // Set a timeout to avoid being stuck on loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setTimeoutOccurred(true);
      }, 5000); // 5 seconds timeout
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  if (isLoading && !timeoutOccurred) {
    return <LoadingIndicator message="Loading your BookMyWhip experience..." />;
  }
  
  if (timeoutOccurred && isLoading) {
    // Fallback if loading takes too long
    return <Redirect to="/auth" />;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

// Public route component (redirects if logged in)
function PublicRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  
  // Set a timeout to avoid being stuck on loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setTimeoutOccurred(true);
      }, 5000); // 5 seconds timeout
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  if (isLoading && !timeoutOccurred) {
    return <LoadingIndicator message="Welcome to BookMyWhip" />;
  }
  
  // If loading for too long, just show the component
  if (timeoutOccurred && isLoading) {
    return <Component {...rest} />;
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

// Define the Router component

function Router() {
  return (
    <Switch>
      <Route path="/" component={(props: any) => <ProtectedRoute component={Home} {...props} />} />
      <Route path="/login" component={(props: any) => <PublicRoute component={Login} {...props} />} />
      <Route path="/register" component={(props: any) => <PublicRoute component={Register} {...props} />} />
      <Route path="/auth" component={(props: any) => <PublicRoute component={AuthPage} {...props} />} />
      <Route path="/verification" component={(props: any) => <ProtectedRoute component={Verification} {...props} />} />
      <Route path="/profile" component={(props: any) => <ProtectedRoute component={Profile} {...props} />} />
      <Route path="/rides" component={(props: any) => <ProtectedRoute component={Rides} {...props} />} />
      <Route path="/payment" component={(props: any) => <ProtectedRoute component={Payment} {...props} />} />
      <Route path="/settings" component={(props: any) => <ProtectedRoute component={Settings} {...props} />} />
      <Route path="/earnings" component={(props: any) => <ProtectedRoute component={Earnings} {...props} />} />
      <Route path="/admin" component={(props: any) => <ProtectedRoute component={Admin} adminOnly={true} {...props} />} />
      <Route path="/audio-preferences" component={(props: any) => <ProtectedRoute component={AudioPreferencesPage} {...props} />} />
      <Route path="/ride-soundtrack" component={(props: any) => <ProtectedRoute component={RideSoundtrackPage} {...props} />} />
      <Route path="/driver-onboarding" component={(props: any) => <ProtectedRoute component={DriverOnboarding} {...props} />} />
      <Route path="/demo" component={Demo} />
      <Route path="/socket-demo" component={SocketDemo} />
      <Route path="/waze-demo" component={WazeDemoPage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Import the providers
import { AuthProvider } from './providers/AuthProvider';
import { NotificationsProvider } from './providers/NotificationsProvider';

// Create a simpler provider structure for demo routes
function DemoRoutes() {
  return (
    <Switch>
      <Route path="/demo" component={Demo} />
      <Route path="/socket-demo" component={SocketDemo} />
      <Route path="/waze-demo" component={WazeDemoPage} />
      <Route path="/navigation-demo" component={NavigationDemo} />
      <Route path="/route-preview-demo" component={RoutePreviewDemo} />
      <Route path="/route-animation-test" component={RouteAnimationTest} />
      <Route path="/azure-maps-demo" component={AzureMapsDemo} />
      <Route path="/real-time-tracking-demo" component={RealTimeTrackingDemo} />
      <Route path="/soundtrack-demo" component={SoundtrackDemoPage} />
      <Route path="*">
        <Redirect to="/demo" />
      </Route>
    </Switch>
  );
}

function App() {
  // Use a demo version for simplicity and to avoid authentication issues
  const isDemoMode = window.location.pathname.includes('/demo') || 
                    window.location.pathname.includes('/socket-demo') || 
                    window.location.pathname.includes('/waze-demo') ||
                    window.location.pathname.includes('/navigation-demo') ||
                    window.location.pathname.includes('/route-preview-demo') ||
                    window.location.pathname.includes('/route-animation-test') ||
                    window.location.pathname.includes('/azure-maps-demo') ||
                    window.location.pathname.includes('/real-time-tracking-demo') ||
                    window.location.pathname.includes('/soundtrack-demo');
  
  if (isDemoMode) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NotificationsProvider>
            <DemoRoutes />
          </NotificationsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationsProvider>
            <Router />
          </NotificationsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
