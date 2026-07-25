# Meta App Review — الجولة الأولى (المحادثات فقط)

## معلومات التطبيق

| الحقل | القيمة |
|---|---|
| App Name | Jawabi (جوابي) |
| Category | Business / Messaging |
| Website | https://jawabi-ai.vercel.app |
| Privacy Policy URL | https://jawabi-ai.vercel.app/legal/privacy |
| Terms of Service URL | https://jawabi-ai.vercel.app/legal/terms |
| Data Deletion URL | https://jawabi-ai.vercel.app/legal/data-deletion |
| Support Email | muhannad.tomeh22@gmail.com |

---

## الصلاحيات المطلوبة (Round 1)

### Facebook Login for Business
- `pages_show_list`
- `pages_messaging`
- `pages_manage_metadata`
- `business_management`

### Instagram
- `instagram_basic`
- `instagram_manage_messages`

### WhatsApp Business Platform
- `whatsapp_business_messaging`
- `whatsapp_business_management`

> ⚠️ **لا تطلب** في هذه الجولة: `pages_manage_engagement`, `pages_read_user_content`, `instagram_manage_comments`. تُطلب لاحقاً بعد الموافقة على الجولة الأولى.

---

## App Verification Details

### How will your app use these permissions? (نص جاهز للنسخ — إنجليزي)

**pages_show_list + pages_messaging + pages_manage_metadata:**
> Jawabi is a SaaS platform that lets business owners connect their Facebook Pages so that an AI assistant can automatically reply to customer messages on their behalf. After the business owner logs in with Facebook Login for Business, we display their list of Pages (`pages_show_list`) so they can select which Page they want the AI assistant to manage. Once selected, we use `pages_manage_metadata` to subscribe the Page to our webhook, and `pages_messaging` to receive incoming Messenger messages and send AI-generated replies within the 24-hour messaging window. Business owners can disable the AI assistant at any time from our dashboard.

**instagram_basic + instagram_manage_messages:**
> Same use case as above, applied to Instagram Business/Creator accounts linked to the Facebook Page. `instagram_basic` is used to read the connected Instagram account ID and username. `instagram_manage_messages` is used to receive and reply to customer DMs through the AI assistant.

**whatsapp_business_messaging + whatsapp_business_management:**
> Business owners connect their WhatsApp Business Account so that the AI assistant can respond to customer inquiries on WhatsApp. `whatsapp_business_management` is used to read the phone numbers registered under the WABA. `whatsapp_business_messaging` is used to send AI-generated replies within the 24-hour customer service window.

**business_management:**
> Required to list assets (Pages, Instagram accounts, WhatsApp Business Accounts) that the logged-in user manages, so they can pick which asset the AI assistant should serve.

---

## Test User Credentials (يجب توفيرها في نموذج المراجعة)

```
Email: reviewer@jawabi-ai.com
Password: [أنشئ حساب تجريبي مخصص للمراجعة]
```

ملاحظة: أنشئ حساب "Test User" داخل Meta App Dashboard → Roles → Test Users، واربطه بصفحة Facebook تجريبية فيها محادثات وهمية.

---

## Screencast Instructions (فيديو 2-4 دقائق)

سجّل شاشة تُظهر التسلسل التالي بدون قطع:

1. **افتح** `https://jawabi-ai.vercel.app` وسجّل الدخول.
2. **Onboarding**: أدخل معلومات النشاط التجاري.
3. **قاعدة المعرفة**: أضف نص/سؤال-جواب واحد على الأقل.
4. **صفحة القنوات** → اضغط "ربط" على Facebook.
5. أظهر شاشة Facebook Login → اختر الصفحة → اقبل الصلاحيات.
6. ارجع للتطبيق وبيّن أن الصفحة أصبحت "متصلة" وحالة البوت "Active".
7. **افتح Messenger** على هاتفك، أرسل رسالة للصفحة، وأظهر رد البوت التلقائي.
8. كرّر نفس التسلسل السريع لـ Instagram و WhatsApp.
9. **ارجع للتطبيق** → صفحة "المحادثات/العملاء" وبيّن أن الرسائل مسجّلة.
10. **صفحة الإعدادات** → أظهر كيف يمكن للمالك إيقاف البوت أو تفعيل التسليم البشري.

> اجعل الفيديو بجودة 1080p، بدون موسيقى، مع تعليق صوتي إنجليزي واضح.

---

## Data Handling Questions (Data Use Checkup)

| السؤال | الإجابة |
|---|---|
| Do you store platform data? | Yes — messages and contact identifiers, encrypted at rest. |
| Retention period | Until the business owner disconnects the channel or requests deletion. |
| Third-party sharing | No third parties. Data processed only via Lovable AI Gateway for reply generation. |
| Deletion mechanism | Users can disconnect any channel from dashboard, or request full deletion via `/legal/data-deletion`. |

---

## Checklist قبل الإرسال

- [ ] البريد الرسمي للنشاط مضاف في Business Manager.
- [ ] Business Verification مكتمل (مطلوب لواتساب و advanced access).
- [ ] Data Use Checkup مكتمل لكل صلاحية.
- [ ] الفيديو مرفوع كـ Unlisted على YouTube أو مباشرة في نموذج المراجعة.
- [ ] كل الروابط القانونية تعمل وتفتح بدون تسجيل دخول.
- [ ] Test User جاهز وموثّق في نموذج المراجعة.