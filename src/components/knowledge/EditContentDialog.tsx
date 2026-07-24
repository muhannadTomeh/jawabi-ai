import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { embedKnowledgeItem } from '@/lib/knowledgeEmbedding';

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
}

interface EditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: KnowledgeItem | null;
  onSuccess: () => void;
}

export function EditContentDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: EditContentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setContent(item.content || '');
      setQuestion(item.question || '');
      setAnswer(item.answer || '');
      setNewImageFile(null);
      setNewImagePreview(null);
    }
  }, [item]);

  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 10 * 1024 * 1024;

  const handleImagePick = (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      toast({ title: 'نوع غير مدعوم', description: 'JPG, PNG, WEBP, GIF فقط', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: 'الحجم كبير', description: 'الحد الأقصى 10 ميجابايت', variant: 'destructive' });
      return;
    }
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleReplaceImage = async () => {
    if (!item || !newImageFile) return;
    setReplacing(true);
    try {
      // Delete old image from storage
      if (item.file_url) {
        const marker = '/knowledge-images/';
        const idx = item.file_url.indexOf(marker);
        if (idx >= 0) {
          const oldPath = item.file_url.substring(idx + marker.length);
          await supabase.storage.from('knowledge-images').remove([oldPath]);
        }
      }

      const ext = newImageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${item.chatbot_id}/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from('knowledge-images')
        .upload(filePath, newImageFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('knowledge-images').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      setAnalyzing(true);
      let analyzedDescription = '';
      try {
        const { data: analyzeData } = await supabase.functions.invoke('analyze-image', {
          body: { image_url: publicUrl, title: title.trim() || item.title },
        });
        analyzedDescription = analyzeData?.description || '';
      } catch (e) {
        console.error('analyze-image failed:', e);
      } finally {
        setAnalyzing(false);
      }

      const combinedContent = [content.trim(), analyzedDescription]
        .filter(Boolean)
        .join('\n\n---\nتحليل تلقائي للصورة:\n');

      const { error: dbErr } = await supabase
        .from('knowledge_items')
        .update({
          file_url: publicUrl,
          file_name: newImageFile.name,
          title: title.trim() || item.title,
          content: combinedContent || null,
        })
        .eq('id', item.id);
      if (dbErr) throw dbErr;
      void embedKnowledgeItem(item.id);

      toast({ title: 'تم استبدال الصورة', description: 'تم تحديث الصورة وتحليلها' });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error('Replace image error:', e);
      toast({ title: 'خطأ', description: 'فشل استبدال الصورة', variant: 'destructive' });
    } finally {
      setReplacing(false);
    }
  };

  const handleSave = async () => {
    if (!item || !title.trim()) return;

    setLoading(true);
    try {
      const updates: Record<string, string> = { title: title.trim() };

      if (item.type === 'text') {
        if (!content.trim()) return;
        updates.content = content.trim();
      } else if (item.type === 'faq') {
        if (!question.trim() || !answer.trim()) return;
        updates.question = question.trim();
        updates.answer = answer.trim();
      } else if (item.type === 'image') {
        updates.content = content.trim();
      }

      const { error } = await supabase
        .from('knowledge_items')
        .update(updates)
        .eq('id', item.id);

      if (error) throw error;
      void embedKnowledgeItem(item.id);

      toast({
        title: 'تم التعديل',
        description: `تم تعديل "${title}" بنجاح`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء التعديل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto text-right sm:max-w-lg" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>تعديل المحتوى</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-right">
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {item.type === 'text' && (
            <div className="space-y-2">
              <Label>المحتوى</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                disabled={loading}
              />
            </div>
          )}

          {item.type === 'image' && (
            <>
              <div className="space-y-2">
                <Label>معاينة الصورة</Label>
                <div className="overflow-hidden rounded-lg border bg-muted">
                  {(newImagePreview || item.file_url) ? (
                    <img
                      src={newImagePreview || item.file_url || ''}
                      alt={item.title}
                      className="mx-auto max-h-72 w-auto object-contain"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {newImageFile && (
                  <p className="text-xs text-muted-foreground">
                    صورة جديدة محددة: {newImageFile.name}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImagePick(f);
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={replacing || analyzing}
                >
                  <Upload className="me-2 h-4 w-4" />
                  اختيار صورة جديدة
                </Button>
                {newImageFile && (
                  <Button
                    type="button"
                    onClick={handleReplaceImage}
                    disabled={replacing || analyzing}
                  >
                    {replacing || analyzing ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        {analyzing ? 'جاري تحليل الصورة...' : 'جاري الاستبدال...'}
                      </>
                    ) : (
                      'استبدال الصورة'
                    )}
                  </Button>
                )}
                {newImageFile && !replacing && !analyzing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setNewImageFile(null);
                      setNewImagePreview(null);
                    }}
                  >
                    إلغاء
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>وصف الصورة (اختياري)</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="وصف يساعد البوت على فهم الصورة"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {item.type === 'faq' && (
            <>
              <div className="space-y-2">
                <Label>السؤال</Label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>الإجابة</Label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={!title.trim() || loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ التعديلات'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
