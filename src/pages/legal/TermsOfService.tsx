import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <Link to="/" className="text-primary text-sm hover:underline">← العودة للرئيسية</Link>
        <h1 className="text-3xl font-bold">شروط الاستخدام</h1>
        <p className="text-sm text-muted-foreground">آخر تحديث: {new Date().toLocaleDateString("ar")}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">قبول الشروط</h2>
          <p>باستخدامك لمنصة جوابي فإنك توافق على هذه الشروط. إذا كنت لا توافق، يرجى عدم استخدام الخدمة.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">وصف الخدمة</h2>
          <p>جوابي منصة SaaS تتيح للمستخدمين إنشاء مساعد ذكاء اصطناعي للرد على العملاء عبر قنوات المراسلة، وربطه بمصادر بيانات وقاعدة معرفة.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">مسؤوليات المستخدم</h2>
          <ul className="list-disc ps-6 space-y-1">
            <li>تقديم معلومات صحيحة أثناء التسجيل.</li>
            <li>الحفاظ على سرية بيانات الدخول.</li>
            <li>الالتزام بسياسات القنوات المربوطة (Meta, Telegram) وقوانين بلدك.</li>
            <li>عدم استخدام المنصة لإرسال محتوى مضلّل أو مسيء أو غير قانوني أو رسائل عشوائية (Spam).</li>
            <li>الحصول على موافقة عملائك قبل معالجة بياناتهم عبر البوت.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">المحتوى والملكية</h2>
          <p>تبقى ملكية قاعدة المعرفة والمحادثات وبيانات العملاء لصاحب الحساب. لجوابي ترخيص محدود لاستخدامها فقط لتشغيل الخدمة.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">حدود المسؤولية</h2>
          <p>الخدمة تُقدَّم "كما هي". لا نضمن دقة كل ردّ يولده الذكاء الاصطناعي، ونحن غير مسؤولين عن أي قرارات تجارية تُتّخذ بناءً على ردود البوت.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">إنهاء الخدمة</h2>
          <p>يحق لنا تعليق أو إنهاء أي حساب يخالف هذه الشروط. يمكنك حذف حسابك في أي وقت عبر <Link to="/legal/data-deletion" className="text-primary hover:underline">صفحة حذف البيانات</Link>.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">التعديلات</h2>
          <p>قد نحدّث هذه الشروط دورياً؛ استمرار استخدامك للمنصة يعني موافقتك على التحديثات.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">التواصل</h2>
          <p><a href="mailto:muhannad.tomeh22@gmail.com" className="text-primary hover:underline">muhannad.tomeh22@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}