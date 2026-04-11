"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Calculator, Receipt,
  ShoppingBag, Settings, Menu, X, TrendingUp, ChevronRight,
  Users, Tag, Bell, CreditCard, LogOut, Zap, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",    group: "main" },
  { href: "/inventory",  icon: Package,          label: "Inventory",    group: "main" },
  { href: "/orders",     icon: ShoppingBag,      label: "Orders",       group: "main", requiresPlan: "pro" },
  { href: "/customers",  icon: Users,            label: "Customers",    group: "main", requiresPlan: "pro" },
  { href: "/receipts",   icon: Receipt,          label: "Receipts",     group: "main" },
  { href: "/calculator", icon: Calculator,       label: "Profit Calc",  group: "main" },
  { href: "/pricing",    icon: Tag,              label: "Auto Pricing", group: "main", requiresPlan: "premium" },
  { href: "/restock",    icon: Bell,             label: "Restock",      group: "main", badge: "Soon" },
  { href: "/billing",    icon: CreditCard,       label: "Billing",      group: "other" },
  { href: "/settings",   icon: Settings,         label: "Settings",     group: "other" },
];

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  pro:     { label: "PRO",     color: "text-accent-red bg-accent-red/15 border-accent-red/25" },
  premium: { label: "PREMIUM", color: "text-amber-400 bg-amber-400/15 border-amber-400/25" },
  free:    { label: "FREE",    color: "text-text-muted bg-[#14141e] border-[#1c1c28]" },
};

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { user, plan, isDemo, signOut } = useAuth();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    router.push("/");
  }

  const planBadge = PLAN_BADGE[plan] || PLAN_BADGE.free;
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Jordan Reeves";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#08080d] font-body">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={()=>setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-[220px] z-40 flex flex-col transition-transform duration-300 ease-in-out",
        "bg-[#0b0b13] border-r border-[#1c1c28]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1c1c28]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-red flex items-center justify-center shadow-lg shadow-accent-red/30 shrink-0">
              <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="font-display font-black text-[15px] text-text-primary tracking-tight">RESELLER</div>
              <div className="font-display font-black text-[15px] text-accent-red tracking-tight -mt-0.5">OS</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[9px] font-display font-black text-text-muted uppercase tracking-[0.15em] px-3 pb-2 pt-1">Navigation</p>
          <div className="space-y-0.5">
            {navItems.filter(i=>i.group==="main").map(({ href, icon: Icon, label, badge, requiresPlan }) => {
              const active = pathname===href || (href!=="/" && pathname.startsWith(href));
              const locked = !isDemo && requiresPlan &&
                ((requiresPlan==="pro" && plan==="free") ||
                 (requiresPlan==="premium" && plan!=="premium"));
              return (
                <Link key={href} href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group relative",
                    active?"bg-accent-red/10 text-accent-red":"text-text-secondary hover:text-text-primary hover:bg-[#14141e]"
                  )}>
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-red rounded-r-full"/>}
                  <Icon size={15} className={cn("shrink-0 transition-colors", active?"text-accent-red":"text-text-muted group-hover:text-text-secondary")}/>
                  <span className="flex-1 truncate">{label}</span>
                  {locked && (
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full border shrink-0",
                      requiresPlan==="premium"?"text-amber-400/70 bg-amber-400/8 border-amber-400/15":"text-accent-red/70 bg-accent-red/8 border-accent-red/15"
                    )}>
                      {requiresPlan==="premium"?<Crown size={8}/>:<Zap size={8}/>}
                    </span>
                  )}
                  {badge && !locked && <span className="text-[9px] font-black bg-[#1c1c28] text-text-muted px-1.5 py-0.5 rounded-full tracking-wide shrink-0">{badge}</span>}
                  {active && <ChevronRight size={12} className="text-accent-red/40 shrink-0"/>}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-2 border-t border-[#1c1c28]">
            <p className="text-[9px] font-display font-black text-text-muted uppercase tracking-[0.15em] px-3 pb-2">Account</p>
            {navItems.filter(i=>i.group==="other").map(({ href, icon: Icon, label }) => {
              const active = pathname===href;
              return (
                <Link key={href} href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group",
                    active?"bg-accent-red/10 text-accent-red":"text-text-secondary hover:text-text-primary hover:bg-[#14141e]"
                  )}>
                  <Icon size={15} className={cn("shrink-0", active?"text-accent-red":"text-text-muted group-hover:text-text-secondary")}/>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User pill */}
        <div className="px-3 pb-4 border-t border-[#1c1c28] pt-3 space-y-2">
          {/* Plan badge */}
          {!isDemo && (
            <Link href="/billing" className={cn("flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110", planBadge.color)}>
              {plan==="premium"?<Crown size={10}/>:plan==="pro"?<Zap size={10}/>:null}
              {planBadge.label} Plan
            </Link>
          )}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#14141e] border border-[#1c1c28]">
            <div className="w-7 h-7 rounded-full bg-accent-red/15 border border-accent-red/25 flex items-center justify-center text-accent-red text-[10px] font-black shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-text-primary truncate">{displayName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-pulse shrink-0"/>
                <span className="text-[10px] text-text-muted">{isDemo?"Demo mode":"Online"}</span>
              </div>
            </div>
            {!isDemo && (
              <button onClick={handleSignOut} className="text-text-muted hover:text-red-400 transition-colors shrink-0" title="Sign out">
                <LogOut size={13}/>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[220px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 h-14 flex items-center gap-4 px-4 lg:px-6 border-b border-[#1c1c28] bg-[#08080d]/90 backdrop-blur-md">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-[#14141e] transition-all">
            {sidebarOpen?<X size={18}/>:<Menu size={18}/>}
          </button>
          <div className="flex-1 flex items-center gap-2 text-xs text-text-muted font-display font-semibold hidden sm:flex">
            <TrendingUp size={12} className="text-accent-red"/>
            <span className="text-text-muted">ResellerOS</span>
            <span>/</span>
            <span className="text-text-secondary capitalize">{pathname.replace("/","") || "home"}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {!isDemo && plan==="free" && (
              <Link href="/billing?plan=pro" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-[11px] font-bold hover:bg-accent-red/15 transition-all">
                <Zap size={11}/> Upgrade
              </Link>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14141e] border border-[#1c1c28]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-pulse"/>
              <span className="text-[11px] text-text-muted font-semibold hidden sm:block">
                {isDemo?"Demo — data saved locally":"Live — all data saved"}
              </span>
            </div>
          </div>
        </header>
        <main className={cn("flex-1 p-4 lg:p-6 page-enter", !mounted && "opacity-0")}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: {
  title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="font-display font-black text-[22px] text-text-primary tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-text-secondary text-sm mt-1 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
