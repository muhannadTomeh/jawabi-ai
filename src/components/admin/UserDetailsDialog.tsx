import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Calendar, Mail, Building2, Bot } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserDetailsDialogProps {
  user: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    role?: "admin" | "user";
    business_name?: string;
    email?: string;
    chatbots_count?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            تفاصيل المستخدم
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {user.full_name?.[0] || "م"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.full_name || "مستخدم"}</h2>
              <div className="flex gap-2 mt-1">
                {user.role === "admin" ? (
                  <Badge className="bg-amber-500/10 text-amber-600">
                    <Shield className="h-3 w-3 ml-1" />
                    أدمن
                  </Badge>
                ) : (
                  <Badge variant="secondary">مستخدم</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  البريد الإلكتروني
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm select-all">{user.email || "غير متوفر"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  المصلحة التجارية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{user.business_name || "غير محدد"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  تاريخ التسجيل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {format(new Date(user.created_at), "dd MMMM yyyy", {
                    locale: ar,
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  عدد البوتات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{user.chatbots_count || 0}</Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-xs text-muted-foreground">
            ID: {user.user_id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
