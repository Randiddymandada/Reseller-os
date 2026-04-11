"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui";

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";

  useEffect(() => {
    // Auto-redirect after 5s
    const t = setTimeout(() => router.push("/dashboard"), 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#08080d] grid-bg flex items-center justify-center p-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>

        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black tracking-wider">
          {plan === "premium" ? <Crown size={11} /> : <Zap size={11} />}
          {plan.toUpperCase()} PLAN ACTIVATED
        </div>

        <h1 className="font-display font-black text-3xl text-text-primary tracking-tight mb-3">
          You're all set!
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Your {plan} plan is now active. All features are unlocked and ready to use.
          Redirecting to your dashboard in a moment.
        </p>

        <div className="space-y-3 mb-8 text-left bg-[#0f0f17] border border-[#1c1c28] rounded-2xl p-5">
          <p className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest mb-3">What's unlocked</p>
          {(plan === "premium"
            ? ["Unlimited inventory", "Full order & customer manager", "Auto pricing engine", "Restock alerts (V3)", "Unlimited receipts", "Advanced analytics"]
            : ["Unlimited inventory", "Full order & customer manager", "Unlimited receipts", "CSV export", "Priority support"]
          ).map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm">
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              <span className="text-text-primary">{f}</span>
            </div>
          ))}
        </div>

        <Link href="/dashboard">
          <Button className="w-full">
            Go to Dashboard <ArrowRight size={16} />
          </Button>
        </Link>

        <p className="text-text-muted text-xs mt-4">
          A receipt was sent to your email. Manage your subscription in{" "}
          <Link href="/billing" className="text-accent-red hover:underline">Billing</Link>.
        </p>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080d] flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>}>
      <BillingSuccessContent />
    </Suspense>
  );
}
