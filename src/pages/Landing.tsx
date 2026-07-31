import { Link } from "react-router-dom";
import { VisitorChat } from "@/components/landing/VisitorChat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
const logo = { url: "/logo.png" };
const robotMascot = { url: "/robot-mascot.png" };
import {
  Bot,
  MessageSquare,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import { Brain, Target, UserCheck, FileText, XCircle } from "lucide-react";
import { FaWhatsapp, FaFacebookMessenger, FaInstagram, FaTelegramPlane } from "react-icons/fa";

const channels = [
  { icon: FaWhatsapp, name: "واتساب", color: "#25D366" },
  { icon: FaFacebookMessenger, name: "ماسنجر", color: "#0084FF" },
  { icon: FaInstagram, name: "انستجرام", color: "#E1306C" },
  { icon: FaTelegramPlane, name: "تيليجرام", color: "#229ED9" },
];

const comparison = [
  { label: "الرد على العملاء", without: "يدوي وبطيء", with: "فوري وذكي" },
  { label: "تفويت العملاء", without: "رسائل ضائعة", with: "لا تفوت أي عميل" },
  { label: "ساعات العمل", without: "محدودة", with: "24/7 بدون توقف" },
  { label: "الضغط على الموظفين", without: "مرهق", with: "أتمتة كاملة" },
  { label: "متابعة العملاء", without: "صعبة", with: "تحليلات وتقارير ذكية" },
];

const capabilities = [
  { icon: Brain, title: "يفهم نية العميل", desc: "يحلّل الرسالة ويستخرج القصد الحقيقي." },
  { icon: MessageSquare, title: "يحاكي أسلوب الإنسان", desc: "ردود طبيعية بلهجتك بدون طابع آلي." },
  { icon: Target, title: "يقنع بالشراء", desc: "يتعامل مع الاعتراضات ويغلق الصفقة." },
  { icon: UserCheck, title: "يحوّل للموظف عند الحاجة", desc: "تسليم سلس مع كامل سياق المحادثة." },
  { icon: FileText, title: "يوثّق ويلخّص", desc: "يحفظ تفاصيل العملاء ويقدّم ملخصات جاهزة." },
  { icon: BarChart3, title: "تحليلات لحظية", desc: "لوحة متكاملة للأداء والنمو والفرص." },
];

const steps = [
  { n: "1", title: "أنشئ حسابك", desc: "سجّل مجاناً في أقل من دقيقة." },
  { n: "2", title: "درّب بوتك", desc: "أضف معلومات عملك ومنتجاتك بسهولة." },
  { n: "3", title: "اربط قنواتك", desc: "فعّل البوت على واتساب وتيليجرام وغيرها." },
  { n: "4", title: "ابدأ البيع", desc: "دع البوت يجيب عملاءك 24/7 ويغلق الصفقات." },
];

export default function Landing() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 flex-row-reverse items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo.url} alt="جوابي" width={36} height={36} className="h-9 w-9" />
            <span className="text-xl font-bold">جوابي</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">المميزات</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">كيف يعمل</a>
            <a href="#cta" className="text-sm text-muted-foreground hover:text-foreground">ابدأ الآن</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth?mode=signup">تجربة مجانية</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-soft)" }}
        />
        <div
          aria-hidden
          className="absolute -top-32 right-1/2 -z-10 h-[500px] w-[500px] translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          {/* Mascot – small floating waving robot */}
          <img
            src={robotMascot.url}
            alt="مساعد جوابي يلوّح بالترحيب"
            loading="eager"
            aria-hidden
            className="pointer-events-none absolute top-6 left-4 h-20 w-20 origin-bottom animate-wave drop-shadow-xl sm:top-8 sm:left-10 sm:h-24 sm:w-24 md:h-32 md:w-32"
          />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              منصة عربية لإنشاء بوتات الذكاء الاصطناعي
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              بوت ذكاء اصطناعي يرد على عملاءك
              <span className="block bg-clip-text text-transparent pb-2 leading-[1.3]" style={{ backgroundImage: "var(--gradient-primary)" }}>
                بالعربية، على مدار الساعة
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              موظف ذكاء اصطناعي يعمل 24 ساعة، يحوّل المحادثات إلى فرص بيع.
              لا يمل، لا ينسى، لا يأخذ إجازات، ويرد على كل عملاءك في نفس اللحظة.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-56 text-base">
                <Link to="/auth?mode=signup">
                  ابدأ تجربتك المجانية
                  <ArrowLeft className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-56 text-base">
                <a href="#features">شاهد المميزات</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              بدون بطاقة ائتمان • إعداد فوري • إلغاء في أي وقت
            </p>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section id="channels" className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">يعمل على كل قنواتك</h2>
          <p className="mt-4 text-muted-foreground">
            اربط جوابي بمنصات التواصل بضغطة زر — لوحة واحدة موحّدة لكل المحادثات.
          </p>
        </div>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {channels.map((c) => (
            <Card
              key={c.name}
              className="group flex flex-col items-center gap-3 p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${c.color}15` }}
              >
                <c.icon size={30} style={{ color: c.color }} />
              </div>
              <span className="text-sm font-semibold">{c.name}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            جوابي لا يرد فقط...
            <span className="block bg-clip-text text-transparent pb-2 leading-[1.3]" style={{ backgroundImage: "var(--gradient-primary)" }}>
              بل يفهم ويتصرف
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">موظف ذكي يفكّر ويتفاعل كأنه فرد من فريقك.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <Card key={c.title} className="group p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground shadow-md"
                style={{ background: "var(--gradient-primary)" }}
              >
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{c.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* With / Without Jawabi */}
      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">الفرق واضح</h2>
            <p className="mt-4 text-muted-foreground">شاهد ما الذي يتغيّر عندما ينضم جوابي إلى فريقك.</p>
          </div>
          <Card className="mx-auto max-w-4xl overflow-hidden p-0">
            <div className="grid grid-cols-3 border-b border-border bg-card text-center text-xs font-semibold sm:text-sm">
              <div className="p-2.5 text-muted-foreground sm:p-4">المقارنة</div>
              <div className="p-2.5 text-destructive sm:p-4">بدون جوابي</div>
              <div className="p-2.5 text-primary sm:p-4">مع جوابي</div>
            </div>
            {comparison.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  "grid grid-cols-3 items-center border-b border-border text-center text-xs last:border-0 sm:text-sm",
                  i % 2 === 1 && "bg-secondary/30"
                )}
              >
                <div className="p-2.5 font-medium sm:p-4">{row.label}</div>
                <div className="flex flex-col items-center justify-center gap-1 p-2.5 text-muted-foreground sm:flex-row sm:gap-2 sm:p-4">
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span>{row.without}</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 p-2.5 text-foreground sm:flex-row sm:gap-2 sm:p-4">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{row.with}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">ابدأ في 4 خطوات بسيطة</h2>
            <p className="mt-4 text-muted-foreground">من الصفر إلى بوت يعمل في أقل من 10 دقائق.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.n}
                </div>
                <h3 className="mb-2 font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat example */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">شاهد جوابي أثناء العمل</h2>
          <p className="mt-4 text-muted-foreground">محادثة حقيقية بأسلوب طبيعي، بلهجتك، وفي أي وقت.</p>
        </div>
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden border-2 p-0">
            <div className="border-b border-border bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span>محادثة مباشرة • مثال</span>
              </div>
            </div>
            <div className="space-y-3 p-6">
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-2 text-sm">
                  السلام عليكم، هل المنتج متوفر؟
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  وعليكم السلام 👋 نعم متوفر بجميع المقاسات والألوان. تحب أرسلك الكتالوج؟
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-2 text-sm">
                  أكيد، وكم سعر التوصيل؟
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                  التوصيل مجاني للطلبات فوق 200 شيكل 🚚
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="container mx-auto px-4 pb-24">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-16 text-center text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Globe className="absolute -bottom-10 -left-10 h-48 w-48 opacity-10" />
          <Sparkles className="absolute -top-6 -right-6 h-32 w-32 opacity-10" />
          <h2 className="text-3xl font-bold md:text-4xl">جرّب جوابي مجاناً اليوم</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">
            انضم لمئات الشركات التي تستخدم جوابي لخدمة عملاءها وزيادة مبيعاتها.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" variant="secondary" className="min-w-56 text-base">
              <Link to="/auth?mode=signup">
                ابدأ تجربتك المجانية
                <ArrowLeft className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">جوابي</span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/legal/privacy" className="hover:text-foreground">سياسة الخصوصية</Link>
            <Link to="/legal/terms" className="hover:text-foreground">شروط الاستخدام</Link>
            <Link to="/legal/data-deletion" className="hover:text-foreground">حذف البيانات</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} جوابي. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
      <VisitorChat />
    </div>
  );
}