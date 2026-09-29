import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Route-based code splitting: each page is loaded on demand,
// dramatically reducing the initial JS bundle and improving FCP/TTI.
//
// After a new deploy, an open tab may still hold the previous index.html and
// request chunk filenames that no longer exist. Retry once, then hard-reload
// so the browser picks up the fresh manifest instead of showing a blank screen.
function lazyWithReload<T extends { default: React.ComponentType<Record<string, never>> }>(
  factory: () => Promise<T>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const key = "chunk-reload-attempted";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        // Never resolves; the page is reloading.
        return await new Promise<T>(() => {});
      }
      throw err;
    }
  });
}

const AuthPage = lazyWithReload(() => import("@/pages/Auth"));
const ForgotPasswordPage = lazyWithReload(() => import("@/pages/ForgotPassword"));
const ResetPasswordPage = lazyWithReload(() => import("@/pages/ResetPassword"));
const Landing = lazyWithReload(() => import("@/pages/Landing"));
const Onboarding = lazyWithReload(() => import("@/pages/Onboarding"));
const DashboardPage = lazyWithReload(() => import("@/pages/Dashboard"));
const KnowledgeBasePage = lazyWithReload(() => import("@/pages/KnowledgeBase"));
const ChannelsPage = lazyWithReload(() => import("@/pages/Channels"));
const AnalyticsPage = lazyWithReload(() => import("@/pages/Analytics"));
const TestChatPage = lazyWithReload(() => import("@/pages/TestChat"));
const SettingsPage = lazyWithReload(() => import("@/pages/Settings"));
const AccountSettingsPage = lazyWithReload(() => import("@/pages/AccountSettings"));
const AdminPage = lazyWithReload(() => import("@/pages/Admin"));
const NotificationsPage = lazyWithReload(() => import("@/pages/Notifications"));
const CustomersPage = lazyWithReload(() => import("@/pages/Customers"));
const NotFound = lazyWithReload(() => import("@/pages/NotFound"));
const PublicChat = lazyWithReload(() => import("@/pages/PublicChat"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Auth route */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Public landing */}
            <Route path="/" element={<Landing />} />

            {/* Public shareable chat */}
            <Route path="/chat/:slug" element={<PublicChat />} />

            {/* Onboarding (auth required, no sidebar) */}
            <Route path="/onboarding" element={<Onboarding />} />
            
            {/* Dashboard routes with layout */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/knowledge" element={<KnowledgeBasePage />} />
              <Route path="/dashboard/channels" element={<ChannelsPage />} />
              <Route path="/dashboard/customers" element={<CustomersPage />} />
              <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
              <Route path="/dashboard/test" element={<TestChatPage />} />
              <Route path="/dashboard/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="/dashboard/account" element={<AccountSettingsPage />} />
              <Route path="/dashboard/admin" element={<AdminPage />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
