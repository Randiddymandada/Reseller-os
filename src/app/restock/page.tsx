"use client";
import { useState } from "react";
import { Bell, Zap, Eye, TrendingUp, Clock, Lock, Search, Sparkles } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// These are PREVIEW items shown only in demo mode to illustrate the feature.
// Real authenticated users see an empty state — their own watchlist will live here in V3.
const PREVIEW_ALERTS = [
  { id:1, name:"Nike Air Jordan 1 Retro High OG 'Bred'", category:"Sneakers",   platform:"SNKRS",    status:"Watching",  lastSeen:"Nov 18, 2024", avgProfit:"$180–$240", enabled:true  },
  { id:2, name:"Supreme Box Logo Hoodie SS25",            category:"Streetwear", platform:"Supreme",  status:"Alert Set", lastSeen:"Nov 20, 2024", avgProfit:"$200–$320", enabled:true  },
  { id:3, name:"Yeezy Foam RNNR 'Onyx'",                 category:"Sneakers",   platform:"Adidas",   status:"Watching",  lastSeen:"Nov 10, 2024", avgProfit:"$60–$90",   enabled:false },
  { id:4, name:"PlayStation 5 Pro Console",              category:"Electronics",platform:"Best Buy", status:"Alert Set", lastSeen:"Nov 22, 2024", avgProfit:"$80–$120",  enabled:true  },
  { id:5, name:"Bape 1st Camo Shark Full Zip Hoodie",    category:"Streetwear", platform:"Bape.com", status:"Watching",  lastSeen:"Oct 30, 2024", avgProfit:"$150–$250", enabled:false },
];

const COMING_FEATURES = [
  { icon: Bell,       title:"Instant Restock Alerts",  desc:"Get notified the second an item drops or restocks on SNKRS, Supreme, eBay, and more." },
  { icon: Zap,        title:"Auto-Queue & Auto-Cart",  desc:"Automatically add items to cart on supported platforms the moment they restock." },
  { icon: Eye,        title:"Price History Tracking",  desc:"Track price trends over time so you know exactly when to buy and when to hold." },
  { icon: TrendingUp, title:"Profit Forecasting",      desc:"See predicted resale value and profit margin before a drop happens." },
  { icon: Clock,      title:"Drop Calendar",           desc:"Upcoming sneaker, streetwear, and electronics drops organized in one calendar." },
  { icon: Search,     title:"Market Scanner",          desc:"Scan eBay, StockX, and GOAT for underpriced listings matching your watchlist." },
];

export default function RestockPage() {
  const { isDemo } = useAuth();

  // Demo mode shows preview alerts with toggles to illustrate the feature.
  // Real authenticated users have an empty watchlist — their data will live here in V3.
  const [previewAlerts, setPreviewAlerts] = useState(PREVIEW_ALERTS);
  const [search, setSearch] = useState("");

  const filteredPreview = previewAlerts.filter(a =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  function togglePreview(id: number) {
    setPreviewAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }

  return (
    <AppLayout>
      <PageHeader
        title="Restock Alerts"
        description="Track products and get notified when they drop or restock."
      />

      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-accent-red/20 bg-gradient-to-r from-accent-red/10 via-accent-red/5 to-transparent p-5 mb-6">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-accent-red/5 to-transparent pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-red/20 border border-accent-red/30 flex items-center justify-center shrink-0">
            <Lock size={18} className="text-accent-red" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display font-black text-text-primary text-base">Live Alerts — Coming in V3</h2>
              <span className="text-[9px] font-black bg-accent-red/20 text-accent-red border border-accent-red/30 px-2 py-0.5 rounded-full tracking-wider">IN DEVELOPMENT</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xl">
              Real-time restock monitoring with instant push notifications is in active development.
              {isDemo
                ? " The watchlist below is a preview of how it will work."
                : " Your personal watchlist will appear here when V3 launches."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Watchlist — left column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1c1c28]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-text-primary text-sm">
                    {isDemo ? "Preview Watchlist" : "Your Watchlist"}
                  </h2>
                  {/* Clear label so demo content is never mistaken for real user data */}
                  {isDemo && (
                    <span className="flex items-center gap-1 text-[9px] font-black bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full tracking-wider">
                      <Sparkles size={8} /> DEMO PREVIEW
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {isDemo
                    ? "Sample data showing how the watchlist will work"
                    : "Your tracked items will appear here in V3"}
                </p>
              </div>

              {/* Search — only useful in demo since real users have no items */}
              {isDemo && (
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="bg-[#14141e] border border-[#1c1c28] rounded-lg text-text-primary text-xs py-2 pl-8 pr-3 w-36 focus:outline-none focus:border-accent-red/50 transition-all placeholder:text-text-muted"
                  />
                </div>
              )}
            </div>

            {/* Demo mode: show preview alerts */}
            {isDemo ? (
              <div className="space-y-2">
                {filteredPreview.map(alert => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-center gap-4 p-3.5 rounded-xl border transition-all",
                      alert.enabled ? "bg-[#14141e] border-[#1c1c28]" : "bg-[#0f0f17] border-[#1c1c28] opacity-60"
                    )}
                  >
                    {/* Toggle */}
                    <button onClick={() => togglePreview(alert.id)} className="shrink-0">
                      <div className={cn(
                        "w-9 h-5 rounded-full transition-colors duration-200 relative",
                        alert.enabled ? "bg-accent-red" : "bg-[#2a2a3a]"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm",
                          alert.enabled ? "left-[18px]" : "left-0.5"
                        )} />
                      </div>
                    </button>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] text-text-primary truncate">{alert.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text-muted">{alert.platform}</span>
                        <span className="text-[10px] text-text-muted">·</span>
                        <span className="text-[10px] text-text-muted">{alert.lastSeen}</span>
                      </div>
                    </div>
                    {/* Right */}
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-emerald-400">{alert.avgProfit}</div>
                      <Badge className={cn(
                        "mt-0.5",
                        alert.status === "Alert Set"
                          ? "text-accent-red bg-accent-red/10 border-accent-red/20"
                          : "text-text-muted bg-[#14141e] border-[#1c1c28]"
                      )}>{alert.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Real user — empty state, no fake data */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#14141e] border border-[#1c1c28] flex items-center justify-center mb-4">
                  <Bell size={24} className="text-text-muted opacity-40" />
                </div>
                <p className="font-display font-bold text-text-primary text-sm mb-1">No items tracked yet</p>
                <p className="text-text-muted text-xs leading-relaxed max-w-xs">
                  Your personal watchlist will live here. When V3 launches, you'll be able to add products and get notified the moment they restock.
                </p>
              </div>
            )}

            {/* Add to watchlist — disabled */}
            <button
              disabled
              className="w-full mt-3 py-3 rounded-xl border border-dashed border-[#2a2a3a] text-text-muted text-xs font-semibold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
            >
              <Bell size={13} /> Add to Watchlist — Available in V3
            </button>
          </Card>
        </div>

        {/* Feature preview — right column */}
        <div className="space-y-3">
          <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest mb-2">What's Coming</div>
          {COMING_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#14141e] border border-[#1c1c28] flex items-center justify-center shrink-0">
                <Icon size={14} className="text-text-muted" />
              </div>
              <div>
                <div className="text-[12px] font-display font-bold text-text-primary mb-0.5">{title}</div>
                <div className="text-[11px] text-text-muted leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}

          <div className="bg-gradient-to-br from-accent-red/8 to-transparent border border-accent-red/15 rounded-xl p-4 mt-4">
            <div className="text-[10px] font-display font-black text-accent-red uppercase tracking-wider mb-2">Notify Me</div>
            <p className="text-xs text-text-muted mb-3">Be the first to know when live alerts go live.</p>
            <div className="flex gap-2">
              <input
                disabled
                placeholder="your@email.com"
                className="flex-1 bg-[#14141e] border border-[#1c1c28] rounded-lg text-text-muted text-xs py-2 px-3 opacity-60 cursor-not-allowed"
              />
              <button
                disabled
                className="px-3 py-2 rounded-lg bg-accent-red/20 text-accent-red text-xs font-bold opacity-60 cursor-not-allowed border border-accent-red/20"
              >
                Notify
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-2 text-center">Available when V3 launches</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
