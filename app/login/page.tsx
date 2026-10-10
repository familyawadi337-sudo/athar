"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck, School } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setupRequired = searchParams.get("setup") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور أو تواصل مع مسؤول النظام.");
        return;
      }

      const next = searchParams.get("next");
      window.location.assign(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell" dir="rtl">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">أ</div>
          <div><strong>أثري</strong><span>منصة الأثر المهني للمعلمين</span></div>
        </div>
        <div className="auth-icon"><ShieldCheck size={25} /></div>
        <p className="auth-eyebrow">دخول آمن للمدرسة</p>
        <h1>مرحبًا بعودتك</h1>
        <p className="auth-subtitle">سجّل الدخول بحسابك المعتمد للوصول إلى مساحة مدرستك.</p>

        {setupRequired && (
          <div className="auth-notice">
            <strong>يلزم إكمال إعداد المصادقة</strong>
            <p>أضف مفاتيح مشروع Supabase إلى متغيرات البيئة في Vercel، ثم أعد النشر لتفعيل الدخول.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">البريد الإلكتروني</label>
          <div className="auth-input-wrap"><Mail size={18} /><input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@school.ae" /></div>
          <label htmlFor="password">كلمة المرور</label>
          <div className="auth-input-wrap"><LockKeyhole size={18} /><input id="password" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" /></div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={loading || setupRequired}>
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="auth-footer"><School size={16} /><span>الدخول للحسابات المعتمدة فقط. إنشاء الحسابات وإسناد الصلاحيات من مسؤول النظام.</span></div>
      </section>
      <div className="auth-background-glow" />
    </main>
  );
}
