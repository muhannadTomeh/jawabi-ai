import { useState, useEffect } from 'react';
import { Plus, Search, FileText, MessageCircle, File, MoreHorizontal, Trash2, Edit, Upload, Image as ImageIcon, Globe, Share2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListSkeleton } from '@/components/layout/PageSkeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useChatbot } from '@/hooks/useChatbot';
import { useToast } from '@/hooks/use-toast';
import { AddContentDialog } from '@/components/knowledge/AddContentDialog';
import { EditContentDialog } from '@/components/knowledge/EditContentDialog';
import { FileUploadDialog } from '@/components/knowledge/FileUploadDialog';

interface KnowledgeItem {
  id: string;
  chatbot_id: string;
  type: string;
  title: string;
  content: string | null;
  question: string | null;
  answer: string | null;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
  source_ref?: string | null;
  auto_sync?: boolean | null;
}

const typeIcons: Record<string, typeof FileText> = {
  text: FileText,
  faq: MessageCircle,
  file: File,
  image: ImageIcon,
  url: Globe,
  social: Share2,
};

const typeLabels: Record<string, string> = {
  text: 'محتوى نصي',
  faq: 'سؤال وجواب',
  file: 'ملف',
  image: 'صورة',
  url: 'رابط ويب',
  social: 'صفحة سوشيال',
};

export default function KnowledgeBasePage() {
  const { chatbot, loading: chatbotLoading } = useChatbot();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<KnowledgeItem | null>(null);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
  const { toast } = useToast();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncSocial = async (item: KnowledgeItem) => {
    if (!item.source_ref) return;
    setSyncingId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-social-content', {
        body: { connection_id: item.source_ref, auto_sync: !!item.auto_sync },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'تمت المزامنة', description: `تم تحديث ${data?.inserted || 0} عنصر` });
      await fetchItems();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e?.message || 'فشلت المزامنة', variant: 'destructive' });
    } finally {
      setSyncingId(null);
    }
  };

  const fetchItems = async () => {
    if (!chatbot) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('chatbot_id', chatbot.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل قاعدة المعرفة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbot) {
      fetchItems();
    }
  }, [chatbot]);

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      // If it's a file/image, delete from storage first
      if (deleteItem.file_url) {
        if (deleteItem.type === 'file') {
          await supabase.storage.from('knowledge-files').remove([deleteItem.file_url]);
        } else if (deleteItem.type === 'image') {
          // file_url for images is a public URL; extract path after the bucket name
          const marker = '/knowledge-images/';
          const idx = deleteItem.file_url.indexOf(marker);
          if (idx >= 0) {
            const path = deleteItem.file_url.substring(idx + marker.length);
            await supabase.storage.from('knowledge-images').remove([path]);
          }
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('knowledge_items')
        .delete()
        .eq('id', deleteItem.id);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== deleteItem.id));

      toast({
        title: 'تم الحذف',
        description: `تم حذف "${deleteItem.title}" بنجاح`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    } finally {
      setDeleteItem(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.question?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (chatbotLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in" dir="rtl">
        <PageHeader title="قاعدة المعرفة" description="أضف محتوى ليتعلم منه الشات بوت" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <PageHeader
        title="قاعدة المعرفة"
        description="أضف محتوى ليتعلم منه الشات بوت"
        actions={
          <>
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="me-2 h-4 w-4" />
              رفع ملف
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              إضافة محتوى
            </Button>
          </>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="البحث في قاعدة المعرفة..."
          className="ps-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content table */}
      {filteredItems.length > 0 ? (
        <div className="surface-panel overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>العنوان</TableHead>
                  <TableHead className="hidden sm:table-cell">النوع</TableHead>
                  <TableHead className="hidden lg:table-cell">التفاصيل</TableHead>
                  <TableHead className="hidden md:table-cell">تاريخ الإضافة</TableHead>
                  <TableHead className="w-12 text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const Icon = typeIcons[item.type] || FileText;
                  const detail =
                    item.type === 'faq' ? item.question : item.file_name || item.file_url || item.content;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </span>
                          <span className="truncate font-medium text-foreground">{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {typeLabels[item.type] || item.type}
                      </TableCell>
                      <TableCell className="hidden max-w-[280px] lg:table-cell">
                        <span className="line-clamp-1 text-sm text-muted-foreground">{detail || '—'}</span>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {new Date(item.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-40">
                            <DropdownMenuItem onClick={() => setEditItem(item)}>
                              <Edit className="me-2 h-4 w-4" />
                              تعديل
                            </DropdownMenuItem>
                            {item.type === 'social' && item.source_ref && (
                              <DropdownMenuItem
                                onClick={() => handleSyncSocial(item)}
                                disabled={syncingId === item.id}
                              >
                                <RefreshCw className={`me-2 h-4 w-4 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                                مزامنة الآن
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteItem(item)}>
                              <Trash2 className="me-2 h-4 w-4" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="surface-panel empty-state">
          <div className="empty-state-icon">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="mt-2 font-semibold text-foreground">
            {searchQuery ? 'لا توجد نتائج' : 'لا يوجد محتوى'}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {searchQuery
              ? 'جرب البحث بكلمات مختلفة'
              : 'أضف أسئلة شائعة أو محتوى نصي أو ملفات لتدريب الشات بوت'}
          </p>
          {!searchQuery && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="me-2 h-4 w-4" />
                رفع ملف
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                إضافة محتوى
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Content Dialog */}
      {chatbot && (
        <AddContentDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          chatbotId={chatbot.id}
          onSuccess={fetchItems}
        />
      )}

      {/* Edit Content Dialog */}
      <EditContentDialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        item={editItem}
        onSuccess={fetchItems}
      />

      {/* File Upload Dialog */}
      {chatbot && (
        <FileUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          chatbotId={chatbot.id}
          onSuccess={fetchItems}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المحتوى</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{deleteItem?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
