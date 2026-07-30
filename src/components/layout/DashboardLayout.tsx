import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppSidebar, MobileSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { PageSkeleton } from './PageSkeletons';
import { useEffect } from 'react';

export function DashboardLayout() {
  const { user, loading } = useAuth();

  const location = useLocation();

  // Scroll to top on every route change so users don't land mid-page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pr-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <span className="text-lg font-semibold">جوابي</span>
          <MobileSidebar />
        </header>
        <div key={location.pathname} className="p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
