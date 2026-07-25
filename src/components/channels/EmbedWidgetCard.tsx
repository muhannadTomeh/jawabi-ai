import { useMemo, useState } from 'react';
import { Code2, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EmbedWidgetCardProps {
  slug: string;
}

/** Lets the owner copy a one-line <script> snippet that mounts the chat widget on any website. */
export function EmbedWidgetCard({ slug }: EmbedWidgetCardProps) {
  const { toast } = useToast();
  const [label, setLabel] = useState('تحدث معنا');
  const [color, setColor] = useState('#16a34a');
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const [copied, setCopied] = useState(false);

  const origin = window.location.origin;
  const snippet = useMemo(
    () =>
      `<script src="${origin}/widget.js"\n  data-slug="${slug}"\n  data-label="${label}"\n  data-color="${color}"\n  data-position="${position}"\n  defer><\/script>`,
    [origin, slug, label, color, position]
  );

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast({ title: 'تم النسخ', description: 'الصق الكود قبل وسم </body> في موقعك' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/10 p-3">
          <Code2 className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">ويدجت الدردشة القابل للتضمين</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف زر دردشة عائم إلى موقعك الإلكتروني بسطر واحد من الكود — يعمل مع أي منصة (WordPress، Shopify، HTML).
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="widget-label">نص الزر</Label>
              <Input id="widget-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widget-color">اللون</Label>
              <div className="flex items-center gap-2">
                <input
                  id="widget-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-md border border-border bg-background p-1"
                />
                <Input value={color} onChange={(e) => setColor(e.target.value)} dir="ltr" className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الموضع</Label>
              <Select value={position} onValueChange={(v) => setPosition(v as 'right' | 'left')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">أسفل اليمين</SelectItem>
                  <SelectItem value="left">أسفل اليسار</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <pre
            dir="ltr"
            className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed text-foreground"
          >
            <code>{snippet}</code>
          </pre>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={copy} variant="outline">
              {copied ? <Check className="me-2 h-4 w-4" /> : <Copy className="me-2 h-4 w-4" />}
              {copied ? 'تم النسخ' : 'نسخ الكود'}
            </Button>
            <Button asChild variant="ghost">
              <a href={`${origin}/chat/${slug}?embed=1`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="me-2 h-4 w-4" />
                معاينة الويدجت
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
