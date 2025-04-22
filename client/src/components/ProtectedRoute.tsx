import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      </Route>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }

  // If route requires admin but user is not admin, redirect to home
  if (adminOnly && !isAdmin) {
    return (
      <Route path={path}>
        {() => <Redirect to="/" />}
      </Route>
    );
  }

  // If authenticated and has correct role, render the component
  return <Route path={path}>{() => <Component />}</Route>;
}