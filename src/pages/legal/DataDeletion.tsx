import { Link } from "react-router-dom";

export default function DataDeletion() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <Link to="/" className="text-primary text-sm hover:underline">← العودة للرئيسية</Link>
        <h1 className="text-3xl font-bold">حذف البيانات</h1>
        <p className="text-sm text-muted-foreground">آخر تحديث: {new Date().toLocaleDateString("ar")}</p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">حذف قناة مربوطة</h2>
          <p>يمكنك في أي وقت فصل قناة (فيسبوك / إنستغرام / واتساب / تيليجرام) من داخل التطبيق:</p>
          <ol className="list-decimal ps-6 space-y-1">
            <li>سجّل الدخول إلى حسابك.</li>
            <li>افتح <span className="font-medium">لوحة التحكم ← القنوات</span>.</li>
            <li>اضغط <span className="font-medium">"فصل"</span> بجانب القناة المطلوبة.</li>
          </ol>
          <p>سيتم فوراً إلغاء اشتراك جوابي في هذه القناة وحذف التوكنات المرتبطة بها.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">حذف الحساب وجميع البيانات</h2>
          <p>لحذف حسابك وكل البيانات المرتبطة به (قاعدة المعرفة، المحادثات، العملاء، القنوات، الإعدادات) نهائياً، أرسل بريداً إلكترونياً إلى:</p>
          <p><a href="mailto:muhannad.tomeh22@gmail.com?subject=طلب%20حذف%20حساب%20جوابي" className="text-primary hover:underline">muhannad.tomeh22@gmail.com</a></p>
          <p>من نفس البريد المسجّل، مع كتابة "طلب حذف حساب" في العنوان. سيتم تنفيذ الطلب خلال 7 أيام عمل وإرسال تأكيد.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Facebook / Instagram Data Deletion Instructions</h2>
          <p>If you connected a Facebook Page or Instagram Business account to Jawabi and want to remove your data, you have two options:</p>
          <ul className="list-disc ps-6 space-y-1">
            <li>Open <span className="font-medium">Dashboard → Channels</span> and click <span className="font-medium">Disconnect</span> next to the account. This immediately revokes access tokens.</li>
            <li>Or from Facebook: <span className="font-medium">Settings → Apps and Websites → Jawabi → Remove</span>. Then email us at <a href="mailto:muhannad.tomeh22@gmail.com" className="text-primary hover:underline">muhannad.tomeh22@gmail.com</a> to purge stored records.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}