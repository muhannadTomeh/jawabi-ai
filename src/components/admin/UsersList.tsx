import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, Shield, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { UserDetailsDialog } from './UserDetailsDialog';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: 'admin' | 'user';
  chatbots_count?: number;
  business_name?: string;
  email?: string;
}


export function UsersList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        const { data: chatbots, error: chatbotsError } = await supabase
          .from('chatbots')
          .select('user_id, business_name');

        if (chatbotsError) throw chatbotsError;

        const rolesMap = new Map(roles?.map((r: any) => [r.user_id, r.role]) || []);
        const chatbotsCount = new Map<string, number>();
        const businessNames = new Map<string, string>();
        
        chatbots?.forEach((c: any) => {
          chatbotsCount.set(c.user_id, (chatbotsCount.get(c.user_id) || 0) + 1);
          if (c.business_name && !businessNames.has(c.user_id)) {
            businessNames.set(c.user_id, c.business_name);
          }
        });

        // Fetch emails for all users using the RPC function
        const enrichedUsers = await Promise.all((profiles || []).map(async (profile: any) => {
          let email = profile.email;
          if (!email) {
            try {
              const { data: emailData, error: emailError } = await supabase
                .rpc('get_user_email', { p_user_id: profile.user_id });
              if (!emailError) email = emailData;
            } catch (err) {
              console.error('Error fetching email for user:', profile.user_id, err);
            }
          }

          return {
            ...profile,
            role: rolesMap.get(profile.user_id) as 'admin' | 'user' | undefined,
            chatbots_count: chatbotsCount.get(profile.user_id) || 0,
            business_name: businessNames.get(profile.user_id) || 'غير محدد',
            email: email || 'غير متوفر'
          };
        }));

        setUsers(enrichedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return 'م';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          المستخدمون ({users.length})
          <span className="sr-only">
            '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
            لكن لماذا البريد الاكتروني غير متوفر ؟
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>لا يوجد مستخدمون بعد</p>
            <p className="mt-2 text-xs opacity-50">؟؟؟</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">الصلاحية</TableHead>
                <TableHead className="text-right">المصلحة التجارية</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.full_name || 'مستخدم'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                        <Shield className="h-3 w-3 ml-1" />
                        أدمن
                      </Badge>
                    ) : (
                      <Badge variant="secondary">مستخدم</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.business_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                       onClick={() => {
                        setSelectedUser(user);
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    <UserDetailsDialog 
      user={selectedUser} 
      open={detailsOpen} 
      onOpenChange={setDetailsOpen} 
    />
    </>
  );
}
