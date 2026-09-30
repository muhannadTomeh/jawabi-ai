import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'المعلومات التي نعالجها',
    body: 'نعالج بيانات الحساب مثل الاسم والبريد الإلكتروني، ومعلومات النشاط التي تضيفها، ومصادر المعرفة، ومحتوى المحادثات وبيانات القنوات التي تختار ربطها. لا نطلب بيانات لا يحتاجها تشغيل الخدمة.',
  },
  {
    title: 'كيف نستخدم المعلومات',
    body: 'نستخدم البيانات لتسجيل الدخول، تشغيل المساعد، توليد الردود، عرض المحادثات والإحصائيات، حماية الخدمة، ومعالجة الأخطاء. لا نبيع بياناتك أو بيانات عملائك.',
  },
  {
    title: 'مزودو الخدمة',
    body: 'تعتمد جوابي على Supabase لتخزين البيانات والمصادقة، وVercel لاستضافة الواجهة، وGoogle Gemini لمعالجة طلبات الذكاء الاصطناعي. قد تعالج هذه الجهات البيانات اللازمة لتقديم وظائفها وفق سياساتها.',
  },
  {
    title: 'الاحتفاظ والحذف',
    body: 'نحتفظ بالبيانات ما دام الحساب نشطًا أو بالقدر اللازم لتشغيل الخدمة والالتزام بالمتطلبات النظامية. يمكنك طلب تصحيح بياناتك أو تصديرها أو حذفها من خلال إدارة الحساب أو التواصل مع مسؤول المنصة.',
  },
  {
    title: 'مسؤوليتك تجاه عملائك',
    body: 'أنت مسؤول عن إبلاغ عملائك بأنهم يتحدثون مع مساعد آلي، وعن امتلاك الأساس النظامي لجمع الرسائل وبيانات التواصل التي تمر عبر القنوات المرتبطة بحسابك.',
  },
  {
    title: 'الأمان والتحديثات',
    body: 'نستخدم ضوابط وصول وعزلًا بين الحسابات وإجراءات تقنية لحماية البيانات، لكن لا توجد خدمة إلكترونية خالية تمامًا من المخاطر. قد نحدّث هذه السياسة وسنغيّر تاريخ التحديث عند ذلك.',
  },
];

export default function PrivacyPage() {
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
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">سياسة الخصوصية</h1>
        <p className="mt-4 leading-8 text-muted-foreground">توضح هذه السياسة بصورة مبسطة البيانات التي تعالجها منصة جوابي عند استخدامك للخدمة أو ربط قنوات التواصل.</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => <section key={section.title}><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-2 leading-8 text-muted-foreground">{section.body}</p></section>)}
        </div>
        <div className="mt-12 rounded-xl border bg-muted/20 p-5 text-sm leading-7 text-muted-foreground">للاستفسار عن بياناتك أو طلب حذفها، استخدم إعدادات الحساب أو تواصل مع مسؤول منصة جوابي.</div>
      </article>
    </main>
  );
}
