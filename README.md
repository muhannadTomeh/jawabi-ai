# Jawabi AI

منصة عربية لإدارة روبوتات خدمة العملاء عبر الويب وواتساب وتيليجرام وماسنجر.

## البنية

- الواجهة: React، TypeScript، Vite، Tailwind CSS.
- الخلفية: Supabase (Auth، Postgres، Storage، Edge Functions).
- الذكاء الاصطناعي: Google Gemini API مباشرة من Supabase Edge Functions.
- الاستضافة: Vercel.

## التشغيل محلياً

```bash
npm install
copy .env.example .env.local
npm run dev
```

املأ متغيرات Supabase في `.env.local`. لا تضع مفتاح Gemini في المتصفح.

## النشر

1. أنشئ مشروع Vercel واربطه بالمستودع؛ الإعدادات الافتراضية لـ Vite كافية.
2. أضف `VITE_SUPABASE_URL` و`VITE_SUPABASE_PUBLISHABLE_KEY` إلى متغيرات بيئة Vercel.
3. اربط مجلد `supabase/` بمشروع Supabase ثم نفّذ migrations والدوال.
4. أضف الأسرار التالية إلى Supabase Edge Functions: `GEMINI_API_KEY` و`SUPABASE_SERVICE_ROLE_KEY`، إضافةً إلى مفاتيح القنوات المستخدمة.
5. أضف رابط Vercel ضمن Redirect URLs في إعدادات Supabase Auth، واضبط OAuth الخاص بـ Google في Supabase عند الحاجة.

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY
```
