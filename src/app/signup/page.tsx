"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const PLAN_PERKS: Record<string, string[]> = {
  free:    ["10 inventory items", "Profit calculator", "5 receipts/month"],
  pro:     ["Unlimited inventory", "Orders & customers", "Unlimited receipts"],
  premium: ["Everything in Pro", "Auto pricing engine", "Restock alerts"],
};

function SignupContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const plan         = (searchParams.get("plan") || "free") as "free"|"pro"|"premium";

  const [form, setForm]     = useState({ email:"", password:"", name:"" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string,string>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) router.replace("/dashboard");
    });
  }, []);

  function validate() {
    const e: Record<string,string> = {};
    if (!form.name.trim())  e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password)     e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    if (!isSupabaseConfigured) {
      await new Promise(r => setTimeout(r, 800));
      toast.success("Account created! Welcome to ResellerOS 🎉");
      router.push("/dashboard");
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, plan } },
    });

    if (error) { toast.error(error.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from("user_plans").upsert({
        user_id: data.user.id, plan: "free",
        created_at: new Date().toISOString(),
      });
      if (plan !== "free") {
        router.push(`/billing?plan=${plan}`);
      } else {
        toast.success("Welcome to ResellerOS! 🎉");
        router.push("/dashboard");
      }
    }
    setLoading(false);
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-[#08080d] grid-bg flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-4xl grid lg:grid-cols-2 overflow-hidden rounded-2xl border border-[#1c1c28] shadow-2xl relative">
        {/* Left */}
        <div className="hidden lg:flex flex-col bg-[#0f0f17] border-r border-[#1c1c28] p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-red/5 to-transparent pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-red/8 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-accent-red flex items-center justify-center shadow-lg shadow-accent-red/30">
              <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <span className="font-display font-black text-[15px] text-text-primary">RESELLER</span>
              <span className="font-display font-black text-[15px] text-accent-red">OS</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-5">
              <span className={cn("text-xs font-black px-2.5 py-1 rounded-full border uppercase tracking-wider",
                plan==="premium"?"text-amber-400 bg-amber-400/10 border-amber-400/20":
                plan==="pro"    ?"text-accent-red bg-accent-red/10 border-accent-red/20":
                "text-text-muted bg-[#14141e] border-[#1c1c28]"
              )}>{plan.toUpperCase()} PLAN</span>
            </div>
            <h2 className="font-display font-black text-3xl text-text-primary leading-tight mb-4">
              {plan==="free"?"Start free,\nupgrade anytime.":plan==="pro"?"Unlock the full\nreseller toolkit.":"Everything you\nneed to scale."}
            </h2>
            <p className="text-text-secondary text-sm mb-8">
              {plan==="free"?"No credit card. Your data stays private.":
               plan==="pro" ?"Unlimited inventory, orders, and receipts.":
               "Auto pricing, restock alerts, and analytics."}
            </p>
            <div className="space-y-3">
              {(PLAN_PERKS[plan]||PLAN_PERKS.free).map(perk=>(
                <div key={perk} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-emerald-400"/>
                  </div>
                  <span className="text-sm text-text-primary">{perk}</span>
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
        {/* Right */}
        <div className="bg-[#0f0f17] p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent-red flex items-center justify-center">
              <TrendingUp size={15} className="text-white"/>
            </div>
            <span className="font-display font-black text-[15px] text-text-primary">RESELLER<span className="text-accent-red">OS</span></span>
          </div>
          <div className="mb-7">
            <h1 className="font-display font-black text-2xl text-text-primary mb-1">Create your account</h1>
            <p className="text-text-secondary text-sm">
              Already have one? <Link href="/login" className="text-accent-red hover:underline">Sign in</Link>
            </p>
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input label="Full Name" value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Jordan Reeves" error={errors.name}/>
            <Input label="Email" type="email" value={form.email} onChange={e=>f("email",e.target.value)} placeholder="you@example.com" error={errors.email}/>
            <div>
              <div className="text-[10px] font-display font-bold text-text-secondary uppercase tracking-wider mb-1.5">Password</div>
              <div className="relative">
                <input type={showPw?"text":"password"} value={form.password} onChange={e=>f("password",e.target.value)} placeholder="Min. 6 characters"
                  className={cn("w-full bg-[#14141e] border rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 transition-all pl-3.5 pr-10 py-2.5",
                    errors.password?"border-red-500/50 focus:ring-red-500/10":"border-[#1c1c28] hover:border-[#2a2a3a] focus:border-accent-red/50 focus:ring-accent-red/10"
                  )}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
              {errors.password&&<span className="text-[11px] text-red-400">⚠ {errors.password}</span>}
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2">
              Create Account <ArrowRight size={16}/>
            </Button>
          </form>
          <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080d] flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin"/></div>}>
      <SignupContent/>
    </Suspense>
  );
}
