"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Lightbulb,
  MoreHorizontal,
  LogOut,
  Plus,
  School,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

type Role = "معلم" | "مرشد" | "مدير مدرسة" | "إداري" | "Super Admin";
type SectionId = "overview" | "works" | "teachers" | "achievements" | "assistant" | "settings";

const categories = [
  { name: "مبادراتي", count: 12, icon: Lightbulb, tone: "amber" },
  { name: "استراتيجياتي", count: 8, icon: BookOpen, tone: "blue" },
  { name: "نشاطاتي", count: 15, icon: Users, tone: "violet" },
  { name: "ابتكاراتي", count: 9, icon: Sparkles, tone: "cyan" },
  { name: "إنجازاتي", count: 4, icon: Trophy, tone: "rose" },
  { name: "أبحاثي", count: 6, icon: FileText, tone: "green" },
];

const works = [
  {
    title: "Smart Canteen",
    category: "مبادراتي",
    date: "اليوم، 09:42",
    description: "مبادرة توظف الذكاء الاصطناعي لتحسين تجربة المقصف المدرسي وترشيد الهدر.",
    tags: ["AI", "Innovation", "Sustainability"],
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "مختبر الابتكار الطلابي",
    category: "ابتكاراتي",
    date: "05 أكتوبر 2026",
    description: "تجربة تعلم قائمة على المشاريع تجمع الذكاء الاصطناعي والروبوتات وحل المشكلات.",
    tags: ["Robotics", "PBL"],
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "التعلم القائم على التحدي",
    category: "استراتيجياتي",
    date: "02 أكتوبر 2026",
    description: "استراتيجية صفية لتحويل الدرس إلى تحد عملي يقود الطلاب إلى إنتاج حل قابل للعرض.",
    tags: ["Active Learning", "Challenge"],
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "معرض الذكاء الاصطناعي",
    category: "نشاطاتي",
    date: "28 سبتمبر 2026",
    description: "توثيق مشاركة الطلبة في معرض الابتكار والذكاء الاصطناعي المدرسي.",
    tags: ["Students", "AI"],
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  },
];

const teachers = [
  { name: "معلم 1", role: "معلم الذكاء الاصطناعي والتكنولوجيا", works: 24, initiatives: 12, avatar: "https://i.pravatar.cc/160?img=12" },
  { name: "معلم 2", role: "معلم الحوسبة", works: 18, initiatives: 7, avatar: "https://i.pravatar.cc/160?img=11" },
  { name: "معلم 3", role: "معلم العلوم", works: 31, initiatives: 9, avatar: "https://i.pravatar.cc/160?img=13" },
  { name: "معلم 4", role: "معلم الرياضيات", works: 16, initiatives: 5, avatar: "https://i.pravatar.cc/160?img=14" },
];

const navItems: { id: SectionId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutGrid },
  { id: "works", label: "أعمالي", icon: Sparkles },
  { id: "teachers", label: "المعلمون", icon: Users },
  { id: "achievements", label: "الإنجازات", icon: Trophy },
  { id: "assistant", label: "مساعد AI", icon: Sparkles },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

export default function Home() {
  const [role, setRole] = useState<Role>("معلم");
  const [profileName, setProfileName] = useState("حساب المدرسة");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
        if (data?.full_name) setProfileName(data.full_name);
        const roleLabels: Record<string, Role> = { teacher: "معلم", counselor: "مرشد", principal: "مدير مدرسة", admin: "إداري", super_admin: "Super Admin" };
        if (data?.role && roleLabels[data.role]) setRole(roleLabels[data.role]);
        else setProfileName(user.email || "حساب المدرسة");
      } catch {
        setProfileName("حساب المدرسة");
      }
    };
    void loadProfile();
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      window.location.assign("/login");
    }
  };
  const [active, setActive] = useState<SectionId>("overview");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const dashboardWorks = useMemo(() => works.slice(0, 3), []);

  return (
    <main className="app-shell" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">أ</div>
          <div>
            <strong>أثري</strong>
            <span>Teacher Portfolio</span>
          </div>
        </div>

        <div className="school-mini">
          <div className="school-logo"><School size={20} /></div>
          <div>
            <strong>مدرسة شمل</strong>
            <span>9037 · Ras Al Khaimah</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={active === id ? "nav-item active" : "nav-item"}
              onClick={() => setActive(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "teachers" && role === "إداري" ? <b className="count-pill">24</b> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="security-box">
            <ShieldCheck size={18} />
            <div>
              <strong>مساحتك محمية</strong>
              <span>صلاحيات المدرسة مفعلة</span>
            </div>
          </div>
          <button className="profile-mini" onClick={() => notify("ملف المستخدم جاهز للتخصيص")}>
            <img src="https://i.pravatar.cc/80?img=12" alt="ملف المعلم" />
            <div>
              <strong>{profileName}</strong>
              <span>{role}</span>
            </div>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <label className="search-box">
            <Search size={18} />
            <input aria-label="البحث" placeholder="ابحث في الأعمال، المعلمين، المبادرات..." />
          </label>
          <div className="top-actions">
            <div className="authenticated-role"><ShieldCheck size={15} /><span>{role}</span></div>
            <button className="icon-button" onClick={() => notify("لا توجد إشعارات جديدة")}>
              <Bell size={20} />
              <i />
            </button>
            <button className="logout-button" onClick={logout} disabled={loggingOut}>
              <LogOut size={16} />{loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
            </button>
          </div>
        </header>

        <div className="content">
          {active === "overview" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow"><span className="status-dot" /> مساحة {role}</div>
                  <h1>مساحتك المهنية،<br /><em>بصمتك التي تبقى.</em></h1>
                  <p>وثّق أعمالك، دع الذكاء الاصطناعي يحول أدلتك إلى توثيق مهني، واستعرض أثر عملك بطريقة تليق به.</p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={18} /> توثيق عمل جديد</button>
                    <button className="ghost-button" onClick={() => setActive("works")}>استعراض أعمالي <ChevronLeft size={17} /></button>
                  </div>
                </div>
                <div className="hero-visual">
                  <div className="orb orb-one" />
                  <div className="orb orb-two" />
                  <div className="floating-card portfolio-card">
                    <div className="card-heading"><span>AI تحليل الصورة</span><Sparkles size={15} /></div>
                    <div className="preview-image">
                      <img src={works[0].image} alt="معاينة Smart Canteen" />
                      <div className="scan-line" />
                    </div>
                    <strong>Smart Canteen</strong>
                    <small>مبادرة ابتكارية · 09:42</small>
                    <div className="ai-line"><Sparkles size={14} /> تم توليد وصف مهني بنجاح <CheckCircle2 size={15} /></div>
                  </div>
                  <div className="floating-card metric-card"><b>24</b><span>عمل موثق</span><BarChart3 size={19} /></div>
                </div>
              </section>

              <section className="stats-grid">
                {[
                  ["إجمالي الأعمال", "24", "+4 هذا الشهر"],
                  ["المبادرات", "12", "+2 جديد"],
                  ["الإنجازات", "4", "3 موثقة بالكامل"],
                  ["اكتمال الملف", "86%", "ممتاز"],
                ].map(([label, value, note]) => (
                  <div className="stat-card" key={label}>
                    <span>{label}</span><b>{value}</b><small>{note}</small>
                  </div>
                ))}
              </section>

              <SectionHeading title="بواباتك المهنية" sub="كل جانب من عملك له مساحة مصممة له." onClick={() => setActive("works")} />
              <div className="category-grid">
                {categories.map(({ name, count, icon: Icon, tone }) => (
                  <button className="category-card" key={name} onClick={() => setActive("works")}>
                    <div className={`category-icon ${tone}`}><Icon size={21} /></div>
                    <div><strong>{name}</strong><span>{count} أعمال موثقة</span></div>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>

              <SectionHeading title="آخر ما وثّقت" sub="أعمالك الأخيرة تظهر هنا كقصة، لا كملفات." onClick={() => setActive("works")} />
              <div className="work-grid">
                {dashboardWorks.map((work) => <WorkCard key={work.title} work={work} onOpen={() => notify("تم فتح قصة العمل")} />)}
              </div>
            </>
          )}

          {active === "works" && (
            <>
              <PageTitle title="أعمالي" sub="مساحة واحدة لكل ما أنجزته ووثّقته." onAdd={() => setShowAdd(true)} />
              <div className="filter-row">
                <button className="filter active">الكل</button>
                {categories.map((category) => <button className="filter" key={category.name}>{category.name}</button>)}
                <label className="filter-search"><Search size={15} /><input placeholder="تصفية الأعمال" /></label>
              </div>
              <div className="work-grid wide">
                {works.concat(works).map((work, index) => <WorkCard key={`${work.title}-${index}`} work={work} onOpen={() => notify("تم فتح قصة العمل")} />)}
              </div>
            </>
          )}

          {active === "teachers" && (
            <>
              <PageTitle title="معلمو مدرسة شمل" sub="استعرض ملفات وإنجازات المعلمين المرتبطين بالمدرسة 9037." />
              <div className="school-banner">
                <div className="school-hero-logo"><School size={27} /></div>
                <div><strong>مدرسة شمل للبنين</strong><span>9037 · 24 مستخدمًا · 487 عملًا موثقًا</span></div>
                <div className="banner-metric"><b>86%</b><span>متوسط اكتمال الملفات</span></div>
              </div>
              <div className="teacher-grid">
                {teachers.map((teacher) => (
                  <article className="teacher-card" key={teacher.name}>
                    <div className="teacher-avatar-wrap"><img src={teacher.avatar} alt={teacher.name} /><i /></div>
                    <strong>{teacher.name}</strong>
                    <span>{teacher.role}</span>
                    <div className="teacher-stats"><b>{teacher.works}<small>عمل</small></b><b>{teacher.initiatives}<small>مبادرة</small></b></div>
                    <button onClick={() => notify(`فتح ملف ${teacher.name}`)}>عرض الملف <ChevronLeft size={15} /></button>
                  </article>
                ))}
              </div>
            </>
          )}

          {active === "achievements" && (
            <>
              <PageTitle title="الإنجازات" sub="جوائز، شهادات، مشاركات ومحطات تستحق أن تبقى." onAdd={() => setShowAdd(true)} />
              <div className="achievement-banner"><Trophy size={29} /><div><strong>4 إنجازات موثقة</strong><span>ملفك يحتوي على أدلة قوية — أضف المزيد لتعزيز القصة.</span></div></div>
              <div className="work-grid">{works.slice(0, 2).map((work) => <WorkCard key={work.title} work={{ ...work, title: "جائزة التميز والابتكار", category: "إنجازاتي" }} onOpen={() => notify("تم فتح الإنجاز")} />)}</div>
            </>
          )}

          {active === "assistant" && (
            <div className="ai-page">
              <div className="ai-hero">
                <div className="ai-icon"><Sparkles size={28} /></div>
                <div><div className="eyebrow">AI PROFESSIONAL ASSISTANT</div><h1>مساعدك لبناء أثر مهني أقوى.</h1><p>حلّل صورة، اكتب وصفًا احترافيًا، اكتشف فجوات التوثيق، أو أنشئ ملخصًا لمسيرتك.</p></div>
              </div>
              <div className="ai-grid">
                {[
                  [ImageIcon, "حلّل صورة", "حوّل صورة واحدة إلى بطاقة توثيق كاملة."],
                  [FileText, "أنشئ ملخص إنجازاتي", "اجمع أعمالك في ملخص مهني متماسك."],
                  [BarChart3, "حلّل ملفي المهني", "اكتشف نقاط القوة وفجوات التوثيق."],
                ].map(([Icon, title, text]) => (
                  <button className="ai-card" key={String(title)} onClick={() => notify(String(title) + " جاهز")}>
                    {typeof Icon === "function" ? <Icon size={23} /> : null}<strong>{String(title)}</strong><span>{String(text)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {active === "settings" && (
            <>
              <PageTitle title="إعدادات الهوية" sub="اجعل ملفك يحمل هوية مهنية متكاملة." />
              <div className="settings-grid">
                <div className="settings-card">
                  <h3>بيانات المعلم</h3>
                  <label>الاسم<input placeholder="أدخل اسم المعلم" /></label>
                  <label>المسمى الوظيفي<input defaultValue="معلم الذكاء الاصطناعي والتكنولوجيا" /></label>
                  <label>نبذة مهنية<textarea defaultValue="أوظف الذكاء الاصطناعي والتكنولوجيا لصناعة تجارب تعلم أكثر تأثيرًا." /></label>
                </div>
                <div className="settings-card">
                  <h3>هوية المدرسة</h3>
                  <label>اسم المدرسة<input defaultValue="مدرسة شمل للبنين" /></label>
                  <label>رقم المدرسة<input defaultValue="9037" /></label>
                  <label>اسم المدير/المديرة<input defaultValue="مدير المدرسة" /></label>
                  <button className="primary-button" onClick={() => notify("تم حفظ الإعدادات")}>حفظ التغييرات</button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="close-button" onClick={() => setShowAdd(false)}><X size={18} /></button>
            <div className="modal-icon"><Sparkles size={23} /></div>
            <h2>وثّق عملًا جديدًا</h2>
            <p>ابدأ بصورة أو ملف، وسيساعدك AI في بناء التوثيق المهني.</p>
            <div className="upload-box"><ImageIcon size={28} /><strong>اسحب صورة أو ملف هنا</strong><span>PNG, JPG, PDF حتى 20MB</span><button onClick={() => notify("تم اختيار ملف تجريبي")}>اختيار ملف</button></div>
            <div className="form-row"><label>عنوان العمل<input placeholder="مثال: معرض الابتكار الطلابي" /></label><label>البوابة<select defaultValue="مبادراتي"><option>مبادراتي</option><option>ابتكاراتي</option><option>نشاطاتي</option><option>استراتيجياتي</option></select></label></div>
            <button className="primary-button full" onClick={() => { setShowAdd(false); notify("تم حفظ العمل كمسودة"); }}><Sparkles size={16} /> تحليل الصورة وإنشاء الوصف</button>
          </div>
        </div>
      )}

      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </main>
  );
}

function SectionHeading({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return <div className="section-heading"><div><h2>{title}</h2><p>{sub}</p></div><button onClick={onClick}>عرض الكل <ChevronLeft size={16} /></button></div>;
}

function PageTitle({ title, sub, onAdd }: { title: string; sub: string; onAdd?: () => void }) {
  return <div className="page-title"><div><div className="eyebrow dark">أثري · مساحة العمل</div><h1>{title}</h1><p>{sub}</p></div>{onAdd ? <button className="primary-button" onClick={onAdd}><Plus size={17} /> توثيق عمل</button> : null}</div>;
}

function WorkCard({ work, onOpen }: { work: (typeof works)[number]; onOpen: () => void }) {
  return <article className="work-card">
    <div className="work-image"><img src={work.image} alt={work.title} /><span>{work.category}</span><div className="work-overlay"><button onClick={onOpen}>عرض القصة <ArrowUpRight size={16} /></button></div></div>
    <div className="work-body"><div className="work-meta"><span>{work.date}</span><Sparkles size={14} /></div><h3>{work.title}</h3><p>{work.description}</p><div className="tags">{work.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div>
  </article>;
}
