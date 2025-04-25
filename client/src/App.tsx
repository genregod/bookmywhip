import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import Rides from "@/pages/rides";
import Payment from "@/pages/payment";
import Admin from "@/pages/admin";

import { useAuth } from "@/hooks/use-auth";
import LoadingIndicator from "@/components/shared/LoadingIndicator";

// Protected route component
function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingIndicator message="Loading..." />;
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

  if (isLoading) {
    return <LoadingIndicator message="Loading..." />;
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={(props: any) => <ProtectedRoute component={Home} {...props} />} />
      <Route path="/login" component={(props: any) => <PublicRoute component={Login} {...props} />} />
      <Route path="/register" component={(props: any) => <PublicRoute component={Register} {...props} />} />
      <Route path="/profile" component={(props: any) => <ProtectedRoute component={Profile} {...props} />} />
      <Route path="/rides" component={(props: any) => <ProtectedRoute component={Rides} {...props} />} />
      <Route path="/payment" component={(props: any) => <ProtectedRoute component={Payment} {...props} />} />
      <Route path="/admin" component={(props: any) => <ProtectedRoute component={Admin} adminOnly={true} {...props} />} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
