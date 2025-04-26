import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Verification from "@/pages/verification";
import Profile from "@/pages/profile";
import Rides from "@/pages/rides";
import Payment from "@/pages/payment";
import Settings from "@/pages/settings";
import Earnings from "@/pages/earnings";
import Admin from "@/pages/admin";

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
    return <Redirect to="/login" />;
  }

  if (!user) {
    return <Redirect to="/login" />;
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
      <Route path="/verification" component={(props: any) => <ProtectedRoute component={Verification} {...props} />} />
      <Route path="/profile" component={(props: any) => <ProtectedRoute component={Profile} {...props} />} />
      <Route path="/rides" component={(props: any) => <ProtectedRoute component={Rides} {...props} />} />
      <Route path="/payment" component={(props: any) => <ProtectedRoute component={Payment} {...props} />} />
      <Route path="/settings" component={(props: any) => <ProtectedRoute component={Settings} {...props} />} />
      <Route path="/earnings" component={(props: any) => <ProtectedRoute component={Earnings} {...props} />} />
      <Route path="/admin" component={(props: any) => <ProtectedRoute component={Admin} adminOnly={true} {...props} />} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Import the AuthProvider
import { AuthProvider } from './providers/AuthProvider';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
