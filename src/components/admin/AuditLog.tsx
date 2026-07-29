import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  impersonate: 'دخول لحساب مستخدم',
};

export function AuditLog() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card dir="rtl" className="text-right">
      <CardHeader>
        <CardTitle>سجل عمليات الأدمن</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد عمليات مسجّلة بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العملية</TableHead>
                  <TableHead className="text-right">الأدمن</TableHead>
                  <TableHead className="text-right">المستخدم المستهدف</TableHead>
                  <TableHead className="text-right">السبب</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{actionLabels[r.action] || r.action}</Badge>
                    </TableCell>
                    <TableCell className="text-right" dir="ltr">{r.admin_email || '—'}</TableCell>
                    <TableCell className="text-right" dir="ltr">{r.target_email || '—'}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.details?.reason || '—'}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'dd MMM yyyy • HH:mm', { locale: ar })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}