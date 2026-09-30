import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppSidebar, MobileSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const mobileTitles: Record<string, string> = {
  '/dashboard': 'نظرة عامة',
  '/dashboard/inbox': 'المحادثات',
  '/dashboard/knowledge': 'قاعدة المعرفة',
  '/dashboard/channels': 'القنوات',
  '/dashboard/customers': 'العملاء',
  '/dashboard/settings': 'إعدادات المساعد',
  '/dashboard/account': 'الحساب',
};

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:pr-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="" className="h-7 w-7" />
            <span className="text-base font-semibold">{mobileTitles[location.pathname] || 'جوابي'}</span>
          </div>
          <MobileSidebar />
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
