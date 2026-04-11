"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff, ArrowRight, BarChart2, Shield, Zap } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ email: "demo@reselleros.io", password: "demo123" });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) router.replace("/dashboard");
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);

    if (!isSupabaseConfigured) {
      await new Promise(r => setTimeout(r, 700));
      toast.success("Welcome back! 👋");
      router.push("/dashboard");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
      setLoading(false);
      return;
    }
    toast.success("Welcome back! 👋");
    router.push("/dashboard");
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-[#08080d] grid-bg flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-4xl grid lg:grid-cols-2 overflow-hidden rounded-2xl border border-[#1c1c28] shadow-2xl relative">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col bg-[#0f0f17] border-r border-[#1c1c28] p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-red/5 to-transparent pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-red/8 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-accent-red flex items-center justify-center shadow-lg shadow-accent-red/30">
              <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <span className="font-display font-black text-[15px] text-text-primary">RESELLER</span>
              <span className="font-display font-black text-[15px] text-accent-red">OS</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-display font-black text-3xl text-text-primary leading-tight mb-4">
              Your reselling<br /><span className="text-accent-red">command center.</span>
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-8">
              Track every flip. Calculate every profit. Generate professional receipts.
            </p>
            <div className="space-y-4">
              {[
                { icon: BarChart2, label: "Real-time profit tracking", desc: "See exactly what you're making on every deal" },
                { icon: Shield,    label: "Verified receipt system",   desc: "Build buyer trust with professional proof of sale" },
                { icon: Zap,       label: "Instant profit calculator", desc: "Know your margin before you pull the trigger" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-red/10 border border-accent-red/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className="text-accent-red" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{label}</div>
                    <div className="text-xs text-text-muted">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 p-4 rounded-xl bg-[#14141e] border border-[#1c1c28]">
            <div className="flex gap-0.5 mb-1.5">{[...Array(5)].map((_,i)=><span key={i} className="text-amber-400 text-xs">★</span>)}</div>
            <p className="text-xs text-text-secondary italic">"ResellerOS changed how I run my sneaker operation."</p>
            <p className="text-xs text-text-muted mt-1 font-semibold">— @kixflip, 200+ flips/month</p>
          </div>
        </div>
        {/* Right — form */}
        <div className="bg-[#0f0f17] p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent-red flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
            <span className="font-display font-black text-[15px] text-text-primary">RESELLER<span className="text-accent-red">OS</span></span>
          </div>
          <div className="mb-7">
            <h1 className="font-display font-black text-2xl text-text-primary mb-1">Sign in</h1>
            <p className="text-text-secondary text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-accent-red hover:underline">Sign up free</Link>
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email" type="email" value={form.email} onChange={e=>f("email",e.target.value)} placeholder="you@example.com" />
            <div>
              <div className="text-[10px] font-display font-bold text-text-secondary uppercase tracking-wider mb-1.5">Password</div>
              <div className="relative">
                <input type={showPw?"text":"password"} value={form.password} onChange={e=>f("password",e.target.value)} placeholder="••••••••"
                  className="w-full bg-[#14141e] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/10 transition-all pl-3.5 pr-10 py-2.5"
                />
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2">
              Continue <ArrowRight size={16}/>
            </Button>
          </form>
          <div className="mt-6 p-3 rounded-lg bg-[#14141e] border border-[#1c1c28]">
            <p className="text-xs text-text-muted text-center">
              {isSupabaseConfigured
                ? <><span className="text-text-secondary font-semibold">Live Mode</span> — Real accounts, real data.</>
                : <><span className="text-text-secondary font-semibold">Demo Mode</span> — Data stored locally. No account needed.</>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
