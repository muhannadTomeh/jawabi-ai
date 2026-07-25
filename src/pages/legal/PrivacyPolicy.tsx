import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <Link to="/" className="text-primary text-sm hover:underline">← العودة للرئيسية</Link>
        <h1 className="text-3xl font-bold">سياسة الخصوصية</h1>
        <p className="text-sm text-muted-foreground">آخر تحديث: {new Date().toLocaleDateString("ar")}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">من نحن</h2>
          <p>جوابي (Jawabi) منصة لإدارة عملائك بالذكاء الاصطناعي، تتيح لأصحاب الأعمال إنشاء مساعد آلي يرد على العملاء عبر واتساب وماسنجر وإنستغرام وتيليجرام والموقع.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">البيانات التي نجمعها</h2>
          <ul className="list-disc ps-6 space-y-1">
            <li>بيانات الحساب: الاسم، البريد الإلكتروني، صورة الملف الشخصي.</li>
            <li>بيانات قاعدة المعرفة التي يضيفها المستخدم لتدريب البوت.</li>
            <li>محتوى المحادثات بين البوت وعملاء المستخدم عبر القنوات المربوطة.</li>
            <li>معلومات القناة المربوطة (Access Tokens, Page IDs) لأغراض التشغيل فقط.</li>
            <li>بيانات استخدام مجهولة الهوية لتحسين الخدمة.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">كيف نستخدم البيانات</h2>
          <ul className="list-disc ps-6 space-y-1">
            <li>تشغيل البوت والرد على رسائل العملاء نيابة عن صاحب الحساب.</li>
            <li>عرض التحليلات والإحصائيات لصاحب الحساب.</li>
            <li>تحسين جودة الردود والخدمة عموماً.</li>
          </ul>
          <p>لا نبيع بياناتك ولا بيانات عملائك لأي طرف ثالث.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">مشاركة البيانات</h2>
          <p>نستخدم مزودي خدمات موثوقين لتشغيل المنصة:</p>
          <ul className="list-disc ps-6 space-y-1">
            <li>Supabase — قاعدة البيانات والمصادقة والتخزين.</li>
            <li>Meta (Facebook, Instagram, WhatsApp) — لإرسال واستقبال الرسائل.</li>
            <li>Telegram — لإرسال واستقبال الرسائل.</li>
            <li>مزودو نماذج الذكاء الاصطناعي — لتوليد الردود.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">التخزين والحماية</h2>
          <p>جميع البيانات محفوظة عبر اتصال مشفّر (HTTPS) ومحمية بسياسات وصول صارمة (Row Level Security). التوكنات الحساسة تُخزَّن على الخادم فقط ولا تُعرض في الواجهة الأمامية.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">حقوقك</h2>
          <ul className="list-disc ps-6 space-y-1">
            <li>الوصول إلى بياناتك وتعديلها من صفحة إعدادات الحساب.</li>
            <li>فصل أي قناة مربوطة في أي وقت من صفحة القنوات.</li>
            <li>طلب حذف حسابك وبياناتك بالكامل — راجع <Link to="/legal/data-deletion" className="text-primary hover:underline">صفحة حذف البيانات</Link>.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">التواصل</h2>
          <p>لأي استفسار حول الخصوصية: <a href="mailto:muhannad.tomeh22@gmail.com" className="text-primary hover:underline">muhannad.tomeh22@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}