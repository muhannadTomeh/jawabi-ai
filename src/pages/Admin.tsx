import { Navigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { AdminStats } from '@/components/admin/AdminStats';
import { UsersList } from '@/components/admin/UsersList';
import { ChatbotsList } from '@/components/admin/ChatbotsList';
import { LlmSettings } from '@/components/admin/LlmSettings';
import { ShieldCheck, Cpu, Users, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/layout/PageSkeletons';

export default function AdminPage() {
  const { isAdmin, loading } = useAdminCheck();

  if (loading) {
    return (
      <div dir="rtl" className="space-y-6">
        <PageHeader title="لوحة تحكم الأدمن" description="إدارة المستخدمين والشات بوتات والإحصائيات العامة" icon={ShieldCheck} />
        <PageSkeleton />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div dir="rtl" className="space-y-8 text-right">
      <PageHeader title="لوحة تحكم الأدمن" description="إدارة المستخدمين والشات بوتات والإحصائيات العامة" icon={ShieldCheck} />

      {/* Stats */}
      <AdminStats />

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4" dir="rtl">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="chatbots" className="gap-2">
            <Bot className="h-4 w-4" />
            الشات بوتات
          </TabsTrigger>
          <TabsTrigger value="llm" className="gap-2">
            <Cpu className="h-4 w-4" />
            نموذج الذكاء
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersList />
        </TabsContent>
        <TabsContent value="chatbots">
          <ChatbotsList />
        </TabsContent>
        <TabsContent value="llm">
          <LlmSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
