import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageSkeleton } from "@/components/layout/PageSkeletons";

// Route-based code splitting: each page is loaded on demand,
// dramatically reducing the initial JS bundle and improving FCP/TTI.
const AuthPage = lazy(() => import("@/pages/Auth"));
const Landing = lazy(() => import("@/pages/Landing"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const KnowledgeBasePage = lazy(() => import("@/pages/KnowledgeBase"));
const ChannelsPage = lazy(() => import("@/pages/Channels"));
const AnalyticsPage = lazy(() => import("@/pages/Analytics"));
const TestChatPage = lazy(() => import("@/pages/TestChat"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const AccountSettingsPage = lazy(() => import("@/pages/AccountSettings"));
const AdminPage = lazy(() => import("@/pages/Admin"));
const NotificationsPage = lazy(() => import("@/pages/Notifications"));
const CustomersPage = lazy(() => import("@/pages/Customers"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PublicChat = lazy(() => import("@/pages/PublicChat"));
const OAuthConsent = lazy(() => import("@/pages/OAuthConsent"));

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
  // Skeleton instead of a full-screen spinner — the shell is already
  // painted, so we only need to fill the main content area.
  return <PageSkeleton />;
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

            {/* OAuth consent screen for MCP / agent integrations */}
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            
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