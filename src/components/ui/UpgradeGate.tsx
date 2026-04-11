"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { Lock, Zap, Crown } from "lucide-react";
import { useAuth, usePlanLimits } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface UpgradeGateProps {
  feature: "orders" | "pricing" | "restock" | "csv";
  children: ReactNode;
  /** If true, renders an overlay on top of blurred content instead of replacing it */
  overlay?: boolean;
}

const GATE_CONFIG = {
  orders: {
    plan: "Pro",
    icon: Zap,
    color: "text-accent-red",
    bg: "bg-accent-red/10 border-accent-red/20",
    title: "Orders & Customers — Pro Feature",
    desc: "Upgrade to Pro to manage your full order pipeline, track customers, and see order history.",
    href: "/billing?plan=pro",
  },
  pricing: {
    plan: "Premium",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    title: "Auto Pricing — Premium Feature",
    desc: "Upgrade to Premium to get instant pricing recommendations across three sale strategies.",
    href: "/billing?plan=premium",
  },
  restock: {
    plan: "Premium",
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
    title: "Restock Alerts — Premium Feature",
    desc: "Upgrade to Premium to access restock monitoring when it launches.",
    href: "/billing?plan=premium",
  },
  csv: {
    plan: "Pro",
    icon: Zap,
    color: "text-accent-red",
    bg: "bg-accent-red/10 border-accent-red/20",
    title: "CSV Export — Pro Feature",
    desc: "Upgrade to Pro to export your inventory as a CSV file.",
    href: "/billing?plan=pro",
  },
};

export function UpgradeGate({ feature, children, overlay = false }: UpgradeGateProps) {
  const { plan, isDemo } = useAuth();
  const limits = usePlanLimits();

  // In demo mode or if feature is unlocked, just render children
  const isLocked =
    (feature === "orders"  && !limits.canUseOrders) ||
    (feature === "pricing" && !limits.canUsePricing) ||
    (feature === "restock" && !limits.canUseRestock) ||
    (feature === "csv"     && !limits.canExportCSV);

  if (isDemo || !isLocked) return <>{children}</>;

  const config = GATE_CONFIG[feature];
  const Icon   = config.icon;

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-30 blur-sm">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-[#08080d]/80 backdrop-blur-sm rounded-2xl">
          <UpgradeBadge config={config} Icon={Icon} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16 px-6">
      <UpgradeBadge config={config} Icon={Icon} />
    </div>
  );
}

function UpgradeBadge({ config, Icon }: { config: typeof GATE_CONFIG[keyof typeof GATE_CONFIG]; Icon: any }) {
  return (
    <div className="text-center max-w-sm">
      <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4", config.bg)}>
        <Lock size={24} className={config.color} />
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <h3 className="font-display font-black text-text-primary text-lg">{config.title}</h3>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed mb-6">{config.desc}</p>
      <Link href={config.href}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm transition-all",
          config.plan === "Premium"
            ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20"
            : "bg-accent-red hover:bg-red-500 text-white shadow-lg shadow-accent-red/20"
        )}>
        <Icon size={15} /> Upgrade to {config.plan}
      </Link>
    </div>
  );
}

/** Inline inventory limit warning banner */
export function InventoryLimitBanner({ count }: { count: number }) {
  const { plan, isDemo } = useAuth();
  const { maxInventory } = usePlanLimits();

  if (isDemo || plan !== "free") return null;
  if (count < maxInventory) return null;

  return (
    <div className="mb-4 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-display font-bold text-text-primary">
          You've reached the free plan limit ({maxInventory} items)
        </div>
        <div className="text-xs text-text-secondary mt-0.5">
          Upgrade to Pro for unlimited inventory tracking.
        </div>
      </div>
      <Link href="/billing?plan=pro"
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-red hover:bg-red-500 text-white text-xs font-display font-bold transition-all">
        <Zap size={13} /> Upgrade
      </Link>
    </div>
  );
}
