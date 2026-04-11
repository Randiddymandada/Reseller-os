"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronRight, Zap, Crown, Star, ExternalLink, Shield } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card, Button, Badge } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "",
    desc: "For getting started",
    icon: Star,
    iconColor: "text-text-muted",
    iconBg: "bg-[#14141e] border-[#1c1c28]",
    features: ["Up to 10 inventory items", "Profit calculator", "Basic dashboard", "5 receipts/month"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$10",
    period: "/month",
    desc: "For serious resellers",
    icon: Zap,
    iconColor: "text-accent-red",
    iconBg: "bg-accent-red/10 border-accent-red/20",
    highlight: true,
    features: ["Unlimited inventory", "Orders & customer manager", "Unlimited receipts", "CSV export", "Priority support"],
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: "$20",
    period: "/month",
    desc: "For power users",
    icon: Crown,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10 border-amber-400/20",
    features: ["Everything in Pro", "Auto pricing engine", "Restock alerts (V3)", "Advanced analytics", "API access (soon)", "White-label receipts"],
  },
];

function BillingContent() {
  const { user, plan: currentPlan, isDemo } = useAuth();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleUpgrade(planId: "pro" | "premium") {
    if (!user && !isDemo) { toast.error("Please sign in first"); return; }
    setCheckoutLoading(planId);

    if (isDemo) {
      await new Promise(r => setTimeout(r, 900));
      toast.success(
        `Demo mode — in production this would open Stripe checkout for the ${planId} plan ($${planId === "pro" ? 10 : 20}/month).`,
        { duration: 5000 }
      );
      setCheckoutLoading(null);
      return;
    }

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, userId: user!.id, email: user!.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || "Failed to start checkout");
    } catch {
      toast.error("Checkout failed — please try again");
    }
    setCheckoutLoading(null);
  }

  async function handlePortal() {
    setPortalLoading(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 700));
      toast.success("Demo mode — this would open the Stripe billing portal to manage your subscription.", { duration: 4000 });
      setPortalLoading(false);
      return;
    }
    try {
      const { data } = await (await import("@/lib/supabase/client")).createClient()
        .from("user_plans").select("stripe_customer_id").eq("user_id", user!.id).single();
      if (!data?.stripe_customer_id) { toast.error("No billing account found"); setPortalLoading(false); return; }
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: data.stripe_customer_id }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast.error("Failed to open billing portal");
    }
    setPortalLoading(false);
  }

  return (
    <AppLayout>
      <PageHeader
        title="Billing & Plan"
        description="Manage your subscription and unlock more features."
      />

      {/* Current plan banner */}
      <div className={cn(
        "mb-6 p-5 rounded-2xl border flex items-center justify-between gap-4",
        currentPlan === "premium" ? "bg-amber-500/8 border-amber-500/20" :
        currentPlan === "pro"     ? "bg-accent-red/8 border-accent-red/20" :
        "bg-[#0f0f17] border-[#1c1c28]"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center",
            currentPlan === "premium" ? "bg-amber-400/10 border-amber-400/20" :
            currentPlan === "pro"     ? "bg-accent-red/10 border-accent-red/20" :
            "bg-[#14141e] border-[#1c1c28]"
          )}>
            {currentPlan === "premium" ? <Crown size={20} className="text-amber-400" /> :
             currentPlan === "pro"     ? <Zap   size={20} className="text-accent-red" /> :
             <Star size={20} className="text-text-muted" />}
          </div>
          <div>
            <div className="font-display font-black text-text-primary text-base">
              {currentPlan === "free" ? "Free Plan" : `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan — Active`}
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              {currentPlan === "free"    ? "Upgrade to unlock unlimited inventory, orders, and more." :
               currentPlan === "pro"     ? "Unlimited inventory, orders, customers, and receipts." :
               "All features unlocked including auto pricing and restock alerts."}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {currentPlan !== "free" && (
            <Button variant="secondary" size="sm" onClick={handlePortal} loading={portalLoading}>
              <ExternalLink size={13} /> Manage Subscription
            </Button>
          )}
          <Badge className={
            currentPlan === "premium" ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
            currentPlan === "pro"     ? "text-accent-red bg-accent-red/10 border-accent-red/20" :
            "text-text-muted bg-[#14141e] border-[#1c1c28]"
          }>
            {currentPlan.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isUpgrade = (plan.id === "pro" && currentPlan === "free") ||
                            (plan.id === "premium" && currentPlan !== "premium");
          const isDowngrade = (plan.id === "free" && currentPlan !== "free") ||
                              (plan.id === "pro" && currentPlan === "premium");

          return (
            <div key={plan.id} className={cn(
              "relative rounded-2xl border p-7 flex flex-col transition-all",
              plan.highlight && !isCurrent ? "bg-accent-red/8 border-accent-red/30" : "bg-[#0f0f17] border-[#1c1c28]",
              isCurrent && "ring-2 ring-emerald-500/25 border-emerald-500/20"
            )}>
              {isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider whitespace-nowrap">
                  CURRENT PLAN
                </div>
              )}
              {plan.highlight && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent-red text-white text-[10px] font-black tracking-wider whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", plan.iconBg)}>
                  <Icon size={18} className={plan.iconColor} />
                </div>
                <div>
                  <div className="font-display font-black text-text-primary text-base">{plan.name}</div>
                  <div className="text-xs text-text-muted">{plan.desc}</div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-5">
                <span className="font-display font-black text-4xl text-text-primary">{plan.price}</span>
                {plan.period && <span className="text-text-muted text-sm">{plan.period}</span>}
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm">
                    <Check size={13} className="text-emerald-400 shrink-0" />
                    <span className="text-text-primary">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrent ? (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-display font-bold">
                  <Check size={14} /> Active Plan
                </div>
              ) : isDowngrade ? (
                <div className="text-center py-3 text-xs text-text-muted font-medium">
                  Downgrade via{" "}
                  <button onClick={handlePortal} className="text-accent-red hover:underline">billing portal</button>
                </div>
              ) : (
                <Button
                  onClick={() => handleUpgrade(plan.id as "pro" | "premium")}
                  loading={checkoutLoading === plan.id}
                  className={cn(
                    "w-full",
                    plan.id === "premium" && "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20 hover:shadow-amber-500/30"
                  )}
                >
                  Upgrade to {plan.name} <ChevronRight size={14} />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Trust strip */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-text-muted" />
            Payments processed securely by <span className="text-text-secondary font-semibold ml-1">Stripe</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-[#1c1c28]" />
          <div>Cancel anytime — no lock-in</div>
          <div className="hidden sm:block w-px h-4 bg-[#1c1c28]" />
          <div>Downgrade takes effect end of billing period</div>
        </div>
      </Card>
    </AppLayout>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingContent />
    </Suspense>
  );
}
