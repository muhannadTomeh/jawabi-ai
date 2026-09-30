import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const sections = [
  { title: 'استخدام الخدمة', body: 'تتيح جوابي إنشاء مساعد آلي وربطه بمصادر معرفة وقنوات تواصل. يجب استخدام الخدمة بصورة نظامية وعدم توظيفها للإساءة أو الاحتيال أو إرسال الرسائل المزعجة أو انتهاك حقوق الآخرين.' },
  { title: 'الحساب والأمان', body: 'أنت مسؤول عن صحة معلومات حسابك وحماية بيانات الدخول والرموز التي تستخدمها لربط القنوات. أخبر مسؤول المنصة فورًا إذا اشتبهت في وصول غير مصرح به.' },
  { title: 'محتوى النشاط', body: 'تظل مسؤولًا عن النصوص والملفات والروابط التي تضيفها، وعن امتلاكك حق استخدامها. لا تضف أسرارًا أو بيانات شخصية حساسة لا يحتاجها المساعد.' },
  { title: 'حدود الذكاء الاصطناعي', body: 'قد تنتج نماذج الذكاء الاصطناعي إجابات ناقصة أو غير دقيقة. يجب اختبار المساعد ومراجعة مصادر المعرفة وعدم الاعتماد عليه وحده في القرارات الطبية أو القانونية أو المالية أو غيرها من القرارات عالية الأثر.' },
  { title: 'الخدمات الخارجية', body: 'تتطلب بعض الوظائف خدمات خارجية مثل Supabase وVercel وGoogle ومنصات التواصل. قد تتأثر الوظائف بتغييرات أو أعطال أو سياسات هذه الجهات.' },
  { title: 'التوفر والتغييرات', body: 'نسعى إلى تشغيل الخدمة باستقرار، لكن لا نضمن عدم انقطاعها. قد نعدّل الوظائف أو هذه الشروط لتحسين الخدمة أو تلبية المتطلبات التقنية والنظامية.' },
  { title: 'إيقاف الاستخدام', body: 'يجوز تقييد الحساب عند إساءة الاستخدام أو تعريض المنصة أو مستخدميها للخطر. يمكنك التوقف عن استخدام الخدمة وطلب حذف بياناتك وفق سياسة الخصوصية.' },
];

export default function TermsPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2"><img src="/assets/logo.png" alt="جوابي" className="h-9 w-9" /><span className="text-lg font-bold">جوابي</span></Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="h-4 w-4" /> الرئيسية</Link>
        </div>
      </header>
      <article className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <p className="text-sm font-medium text-primary">آخر تحديث: 30 سبتمبر 2026</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">شروط الاستخدام</h1>
        <p className="mt-4 leading-8 text-muted-foreground">باستخدام جوابي، فإنك توافق على استخدام المنصة بصورة مسؤولة وعلى مراجعة مخرجات المساعد قبل الاعتماد عليها في أعمالك.</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => <section key={section.title}><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-2 leading-8 text-muted-foreground">{section.body}</p></section>)}
        </div>
        <div className="mt-12 rounded-xl border bg-muted/20 p-5 text-sm leading-7 text-muted-foreground">هذه الشروط جزء من النسخة الأولية للخدمة ويجب مراجعتها قانونيًا قبل التوسع التجاري أو بدء الاشتراكات المدفوعة.</div>
      </article>
    </main>
  );
}
