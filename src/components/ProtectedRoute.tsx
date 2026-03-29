import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading, isAdmin, profile } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  // Check onboarding
  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding' && !adminOnly) {
    return <Navigate to="/onboarding" replace />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  // Redirect admin users from /dashboard to /admin
  if (!adminOnly && isAdmin && location.pathname === '/dashboard') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
