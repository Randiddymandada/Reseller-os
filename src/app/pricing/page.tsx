"use client";
import { useState, useMemo } from "react";
import { Tag, BarChart2, DollarSign, Info, RotateCcw } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card, Input, Select, Button } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/UpgradeGate";

const PLATFORMS = [
  { label: "eBay",     fee: 12.9 },
  { label: "StockX",   fee: 9.0  },
  { label: "GOAT",     fee: 9.5  },
  { label: "Grailed",  fee: 9.0  },
  { label: "Depop",    fee: 10.0 },
  { label: "Poshmark", fee: 20.0 },
  { label: "Facebook", fee: 5.0  },
  { label: "Direct",   fee: 0.0  },
];

const CATEGORIES = ["Sneakers","Streetwear","Electronics","Luxury Bags","Accessories","Trading Cards","Collectibles","Other"];
const CONDITIONS  = ["New","Like New","Good","Fair","Poor"];

const CONDITION_MULT: Record<string, number> = {
  "New": 1.0, "Like New": 0.92, "Good": 0.82, "Fair": 0.68, "Poor": 0.55,
};

const CATEGORY_BANDS: Record<string, [number, number, number]> = {
  "Sneakers":      [0.30, 0.55, 0.90],
  "Streetwear":    [0.35, 0.60, 1.00],
  "Electronics":   [0.12, 0.22, 0.38],
  "Luxury Bags":   [0.30, 0.55, 0.95],
  "Accessories":   [0.25, 0.45, 0.75],
  "Trading Cards": [0.40, 0.75, 1.40],
  "Collectibles":  [0.35, 0.65, 1.10],
  "Other":         [0.20, 0.40, 0.70],
};

interface PriceTier {
  label: string; tag: "Quick Flip"|"Balanced"|"High Margin"; icon: string;
  color: string; borderColor: string; bgColor: string;
  sellPrice: number; netProfit: number; margin: number; daysToSell: string;
}

function calcTiers(buy: number, feeRate: number, ship: number, targetProfit: number, category: string, condition: string): PriceTier[] {
  const bands    = CATEGORY_BANDS[category] || CATEGORY_BANDS["Other"];
  const condMult = CONDITION_MULT[condition] || 1.0;
  const fee      = feeRate / 100;

  const np = (sell: number) => sell - buy - sell * fee - ship;
  const mg = (sell: number) => sell > 0 ? (np(sell) / sell) * 100 : 0;

  const fast    = Math.ceil(buy * (1 + bands[0] * condMult));
  const balanced= Math.ceil(buy * (1 + bands[1] * condMult));
  const maxProf = Math.ceil(buy * (1 + bands[2] * condMult));

  let balFinal = balanced;
  if (targetProfit > 0) {
    const targetSell = Math.ceil((targetProfit + buy + ship) / (1 - fee));
    balFinal = Math.ceil((balanced + targetSell) / 2);
  }

  return [
    { label:"Fast Sale",    tag:"Quick Flip",  icon:"⚡", color:"text-blue-400",    borderColor:"border-blue-500/20",    bgColor:"bg-blue-500/5",    sellPrice:fast,     netProfit:np(fast),     margin:mg(fast),     daysToSell:"1–3 days"   },
    { label:"Market Price", tag:"Balanced",    icon:"⚖️", color:"text-emerald-400", borderColor:"border-emerald-500/20", bgColor:"bg-emerald-500/5", sellPrice:balFinal, netProfit:np(balFinal), margin:mg(balFinal), daysToSell:"5–14 days"  },
    { label:"Max Profit",   tag:"High Margin", icon:"🔥", color:"text-amber-400",   borderColor:"border-amber-500/20",   bgColor:"bg-amber-500/5",   sellPrice:maxProf,  netProfit:np(maxProf),  margin:mg(maxProf),  daysToSell:"2–6 weeks"  },
  ];
}

const DEFAULT = { itemName:"", category:"Sneakers", condition:"New", buyPrice:"210", platform:"eBay", platformFee:"12.9", shippingCost:"12", targetProfit:"" };

export default function PricingPage() {
  const [form, setForm] = useState(DEFAULT);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const tiers = useMemo<PriceTier[]>(() => {
    const buy = parseFloat(form.buyPrice) || 0;
    if (buy <= 0) return [];
    return calcTiers(buy, parseFloat(form.platformFee)||0, parseFloat(form.shippingCost)||0, parseFloat(form.targetProfit)||0, form.category, form.condition);
  }, [form]);

  return (
    <UpgradeGate feature="pricing">
    <AppLayout>
      <PageHeader
        title="Auto Pricing"
        description="Get instant pricing recommendations across three sale strategies."
        action={<Button variant="secondary" size="sm" onClick={() => setForm(DEFAULT)}><RotateCcw size={13} /> Reset</Button>}
      />

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#1c1c28]">
              <div className="w-7 h-7 rounded-lg bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
                <Tag size={14} className="text-accent-red" />
              </div>
              <h2 className="font-display font-bold text-text-primary text-sm">Item Details</h2>
            </div>
            <div className="space-y-4">
              <Input label="Item Name (optional)" value={form.itemName} onChange={e => f("itemName", e.target.value)} placeholder="e.g. Nike Air Jordan 4" />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Category" value={form.category} onChange={e => f("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </Select>
                <Select label="Condition" value={form.condition} onChange={e => f("condition", e.target.value)}>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </Select>
              </div>
              <Input label="Buy Price" prefix="$" type="number" min="0" step="0.01" value={form.buyPrice} onChange={e => f("buyPrice", e.target.value)} placeholder="0.00" />
              <Input label="Target Profit (optional)" prefix="$" type="number" min="0" step="0.01" value={form.targetProfit} onChange={e => f("targetProfit", e.target.value)} placeholder="e.g. 80" hint="Biases the Balanced price" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#1c1c28]">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <DollarSign size={14} className="text-amber-400" />
              </div>
              <h2 className="font-display font-bold text-text-primary text-sm">Platform & Fees</h2>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {PLATFORMS.map(p => (
                <button key={p.label} onClick={() => { f("platform", p.label); f("platformFee", String(p.fee)); }}
                  className={cn("py-2 px-1 rounded-lg border text-center transition-all duration-150",
                    form.platform === p.label
                      ? "bg-accent-red/10 border-accent-red/30 text-accent-red"
                      : "bg-[#14141e] border-[#1c1c28] text-text-secondary hover:border-[#2a2a3a] hover:text-text-primary"
                  )}>
                  <div className="text-[11px] font-bold">{p.label}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">{p.fee > 0 ? `${p.fee}%` : "Free"}</div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Platform Fee" suffix="%" type="number" min="0" max="100" step="0.1" value={form.platformFee} onChange={e => f("platformFee", e.target.value)} />
              <Input label="Shipping Cost" prefix="$" type="number" min="0" step="0.01" value={form.shippingCost} onChange={e => f("shippingCost", e.target.value)} />
            </div>
          </Card>

          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#0f0f17] border border-[#1c1c28]">
            <Info size={13} className="text-text-muted shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-muted leading-relaxed">
              Prices use category market bands × condition multipliers. Verify on StockX, eBay, or GOAT before listing.
            </p>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="lg:col-span-3">
          {tiers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#14141e] border border-[#1c1c28] flex items-center justify-center mb-4">
                <Tag size={28} className="text-text-muted opacity-40" />
              </div>
              <p className="text-text-primary font-display font-bold text-base mb-1">Enter a buy price to get started</p>
              <p className="text-text-muted text-sm">Pricing suggestions will appear here instantly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {form.itemName && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest">Pricing for</span>
                  <span className="text-sm font-display font-bold text-text-primary">{form.itemName}</span>
                </div>
              )}

              {tiers.map((tier, i) => (
                <div key={tier.tag} className={cn("rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5", tier.bgColor, tier.borderColor, i === 1 && "ring-1 ring-emerald-500/20")}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{tier.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-text-primary text-base">{tier.label}</span>
                          {i === 1 && <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full tracking-wide">RECOMMENDED</span>}
                        </div>
                        <span className={cn("text-[11px] font-bold", tier.color)}>{tier.tag}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-0.5">List At</div>
                      <div className="text-3xl font-display font-black text-text-primary">{formatCurrency(tier.sellPrice)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label:"Net Profit", value:formatCurrency(tier.netProfit), hi:true },
                      { label:"Margin",     value:`${tier.margin.toFixed(1)}%` },
                      { label:"Est. Time",  value:tier.daysToSell },
                    ].map(({ label, value, hi }) => (
                      <div key={label} className="bg-black/20 rounded-xl px-3 py-2.5 text-center">
                        <div className="text-[9px] font-display font-black text-text-muted uppercase tracking-wider mb-1">{label}</div>
                        <div className={cn("text-sm font-display font-black", hi ? tier.color : "text-text-primary")}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 border-t border-white/5 pt-3">
                    {[
                      { l:"Sale Price",   v:formatCurrency(tier.sellPrice) },
                      { l:`Fee (${form.platformFee}%)`, v:`-${formatCurrency(tier.sellPrice*(parseFloat(form.platformFee)||0)/100)}` },
                      { l:"Shipping",     v:`-${formatCurrency(parseFloat(form.shippingCost)||0)}` },
                      { l:"Cost of Goods",v:`-${formatCurrency(parseFloat(form.buyPrice)||0)}` },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex justify-between text-xs">
                        <span className="text-text-muted">{l}</span>
                        <span className="font-mono text-text-secondary">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-white/5">
                      <span className={tier.color}>Net Profit</span>
                      <span className={cn("font-mono", tier.color)}>{tier.netProfit >= 0 ? "+" : ""}{formatCurrency(tier.netProfit)}</span>
                    </div>
                  </div>
                </div>
              ))}

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 size={13} className="text-text-muted" />
                  <span className="text-[11px] font-display font-black text-text-muted uppercase tracking-wider">Price Comparison</span>
                </div>
                <div className="space-y-2.5">
                  {tiers.map(tier => {
                    const maxP = Math.max(...tiers.map(t => t.sellPrice));
                    const pct  = maxP > 0 ? (tier.sellPrice / maxP) * 100 : 0;
                    return (
                      <div key={tier.tag}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary">{tier.label}</span>
                          <span className={cn("font-mono font-bold", tier.color)}>{formatCurrency(tier.sellPrice)}</span>
                        </div>
                        <div className="h-1.5 bg-[#1c1c28] rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-700",
                            tier.tag==="Quick Flip"?"bg-blue-400":tier.tag==="Balanced"?"bg-emerald-400":"bg-amber-400"
                          )} style={{ width:`${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
    </UpgradeGate>
  );
}
