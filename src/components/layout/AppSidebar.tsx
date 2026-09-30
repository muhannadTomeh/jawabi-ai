import { useLocation, Link } from 'react-router-dom';
import {
  Bot,
  BookOpen,
  Share2,
  Settings,
  Inbox,
  LogOut,
  User,
  ShieldCheck,
  Users,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useNotifications } from '@/hooks/useNotifications';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'نظرة عامة', href: '/dashboard', icon: Bot },
  { name: 'المحادثات', href: '/dashboard/inbox', icon: Inbox },
  { name: 'قاعدة المعرفة', href: '/dashboard/knowledge', icon: BookOpen },
  { name: 'القنوات', href: '/dashboard/channels', icon: Share2 },
  { name: 'العملاء', href: '/dashboard/customers', icon: Users },
];

const botSettingsItem = { name: 'إعدادات المساعد', href: '/dashboard/settings', icon: Settings };

const accountNavItem = { name: 'إعدادات الحساب', href: '/dashboard/account', icon: UserCog };

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="جوابي" width={32} height={32} className="h-8 w-8" />
            <span className="text-xl font-semibold tracking-tight text-foreground">
              جوابي
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'nav-item',
                  active ? 'nav-item-active' : 'nav-item-inactive'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {item.href === '/dashboard/inbox' && unreadCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            المساعد
          </div>
          <Link
            to={botSettingsItem.href}
            onClick={onNavigate}
            className={cn('nav-item', isActive(botSettingsItem.href) ? 'nav-item-active' : 'nav-item-inactive')}
          >
            <botSettingsItem.icon className="h-5 w-5" />
            <span>{botSettingsItem.name}</span>
          </Link>
          
          {/* Admin Link */}
          {isAdmin && (
            <Link
              to="/dashboard/admin"
              onClick={onNavigate}
              className={cn(
                'nav-item mt-4 border-t border-sidebar-border pt-4',
                isActive('/dashboard/admin') ? 'nav-item-active' : 'nav-item-inactive'
              )}
            >
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <span>لوحة الأدمن</span>
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <Link
            to={accountNavItem.href}
            onClick={onNavigate}
            className={cn(
              'nav-item mb-2',
              isActive(accountNavItem.href) ? 'nav-item-active' : 'nav-item-inactive'
            )}
          >
            <accountNavItem.icon className="h-5 w-5" />
            <span>{accountNavItem.name}</span>
          </Link>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.user_metadata?.full_name || 'مستخدم'}
              </p>
              <p className="truncate text-xs text-muted-foreground" dir="ltr">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen w-64 border-l border-sidebar-border bg-sidebar lg:block">
      <SidebarInner />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { unreadCount } = useNotifications();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground"
          aria-label="القائمة"
        >
          <Menu className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <SidebarInner onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
