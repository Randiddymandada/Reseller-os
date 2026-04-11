"use client";
import { useState, useMemo } from "react";
import { DollarSign, Percent, TrendingUp, TrendingDown, Info, Zap, RotateCcw } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Card, Input, Button } from "@/components/ui";
import { calcProfit, formatCurrency, getRatingColor, getRatingLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth-context";

const PRESETS = [
  { label: "eBay",      fee: 12.9, icon: "🛒" },
  { label: "StockX",    fee: 9.0,  icon: "👟" },
  { label: "GOAT",      fee: 9.5,  icon: "🐐" },
  { label: "Grailed",   fee: 9.0,  icon: "👕" },
  { label: "Depop",     fee: 10.0, icon: "📦" },
  { label: "Poshmark",  fee: 20.0, icon: "👗" },
  { label: "Facebook",  fee: 5.0,  icon: "📘" },
  { label: "Direct",    fee: 0.0,  icon: "💬" },
];

// Demo preset — shown only in demo/unauthenticated mode as a worked example
const DEMO_DEFAULT = {
  buyPrice: 200, sellPrice: 380,
  shippingCost: 12, taxes: 0,
  platformFeePercent: 12.9, extraCosts: 0,
};

// Blank state for real authenticated users — no fake numbers presented as theirs
const BLANK_DEFAULT = {
  buyPrice: 0, sellPrice: 0,
  shippingCost: 0, taxes: 0,
  platformFeePercent: 12.9, extraCosts: 0,
};

function NumInput({ label, value, onChange, prefix, suffix, hint, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; hint?: string; min?: number;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-[10px] font-display font-bold text-text-muted uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[10px] text-text-muted">{hint}</span>}
      </div>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-text-muted text-sm font-mono pointer-events-none">{prefix}</span>}
        <input
          type="number" min={min} step="0.01" value={value || ""}
          placeholder="0.00"
          onChange={e => {
            const raw = e.target.value;
            if (raw === "" || raw === "-") { onChange(0); return; }
            const v = parseFloat(raw);
            if (!isNaN(v) && v >= min) onChange(v);
          }}
          className={cn(
            "w-full bg-[#14141e] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-lg",
            "text-text-primary text-sm font-mono py-2.5 transition-all",
            "focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/10",
            "placeholder:text-text-muted",
            prefix ? "pl-7" : "pl-3.5",
            suffix ? "pr-8" : "pr-3.5",
          )}
        />
        {suffix && <span className="absolute right-3 text-text-muted text-sm pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, prefix, suffix }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; prefix?: string; suffix?: string;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] text-text-secondary font-medium">{label}</span>
        <span className="text-[12px] font-mono font-bold text-text-primary bg-[#14141e] border border-[#1c1c28] px-2 py-0.5 rounded-md">
          {prefix}{value.toFixed(step < 1 ? 1 : 0)}{suffix}
        </span>
      </div>
      <div className="relative">
        <div className="h-1.5 bg-[#1c1c28] rounded-full overflow-hidden">
          <div className="h-full bg-accent-red rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5"
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted mt-1">
        <span>{prefix}{min}{suffix}</span><span>{prefix}{max}{suffix}</span>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const { isDemo } = useAuth();

  // Real users start blank. Demo mode starts with an example deal.
  const initialValues = isDemo ? DEMO_DEFAULT : BLANK_DEFAULT;
  const resetValues   = isDemo ? DEMO_DEFAULT : BLANK_DEFAULT;

  const [v, setV] = useState(initialValues);
  const set = (k: string, val: number) => setV(p => ({ ...p, [k]: val }));

  const hasInput = v.buyPrice > 0 || v.sellPrice > 0;
  const result = useMemo(() => calcProfit(v), [v]);

  const marginGaugeData = [{
    value: Math.max(0, Math.min(100, result.profitMargin)),
    fill: result.profitMargin >= 20 ? "#2a9d8f" : result.profitMargin >= 10 ? "#f4a261" : "#e63946",
  }];

  const ratingColor = getRatingColor(result.rating);
  const breakEven = v.shippingCost + v.taxes + result.platformFee + v.extraCosts + v.buyPrice;

  return (
    <AppLayout>
      <PageHeader
        title="Profit Calculator"
        description="Know your exact margin before you buy."
        action={
          <Button variant="secondary" size="sm" onClick={() => setV(resetValues)}>
            <RotateCcw size={13} /> Reset
          </Button>
        }
      />

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ── Left: Inputs ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Pricing */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
                <DollarSign size={14} className="text-accent-red" />
              </div>
              <h2 className="font-display font-bold text-text-primary text-sm">Pricing</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <NumInput label="Buy Price"  value={v.buyPrice}  onChange={val => set("buyPrice",  val)} prefix="$" />
              <NumInput label="Sell Price" value={v.sellPrice} onChange={val => set("sellPrice", val)} prefix="$" />
            </div>
            <SliderRow
              label="Sell price"
              value={v.sellPrice}
              min={0}
              max={Math.max(1000, v.sellPrice * 2, v.buyPrice * 3)}
              step={5}
              onChange={val => set("sellPrice", val)}
              prefix="$"
            />
          </Card>

          {/* Fees */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Percent size={14} className="text-amber-400" />
              </div>
              <h2 className="font-display font-bold text-text-primary text-sm">Fees & Costs</h2>
            </div>

            {/* Platform presets */}
            <div className="mb-5">
              <p className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-2">Platform</p>
              <div className="grid grid-cols-4 gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => set("platformFeePercent", p.fee)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all duration-150",
                      Math.abs(v.platformFeePercent - p.fee) < 0.01
                        ? "bg-accent-red/10 border-accent-red/30 text-accent-red"
                        : "bg-[#14141e] border-[#1c1c28] text-text-secondary hover:border-[#2a2a3a] hover:text-text-primary"
                    )}
                  >
                    <span className="text-base leading-none">{p.icon}</span>
                    <span className="text-[10px] font-bold">{p.label}</span>
                    <span className="text-[9px] opacity-70">{p.fee > 0 ? `${p.fee}%` : "Free"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Shipping Cost" value={v.shippingCost}       onChange={val => set("shippingCost", val)}       prefix="$" />
              <NumInput label="Platform Fee"  value={v.platformFeePercent} onChange={val => set("platformFeePercent", val)} suffix="%" />
              <NumInput label="Taxes"         value={v.taxes}              onChange={val => set("taxes", val)}              prefix="$" />
              <NumInput label="Other Costs"   value={v.extraCosts}         onChange={val => set("extraCosts", val)}         prefix="$" hint="packing, etc." />
            </div>
          </Card>

          {/* Break-even (only shown when there's input) */}
          {hasInput && (
            <div className="p-4 rounded-xl bg-[#0f0f17] border border-[#1c1c28] flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted">
                <Info size={14} />
                <span className="text-xs">Break-even price</span>
              </div>
              <span className="text-sm font-mono font-bold text-text-primary">{formatCurrency(breakEven)}</span>
            </div>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Empty prompt for real users who haven't typed anything yet */}
          {!hasInput ? (
            <div className="rounded-2xl border border-[#1c1c28] bg-[#0f0f17] p-8 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#14141e] border border-[#1c1c28] flex items-center justify-center">
                <DollarSign size={24} className="text-text-muted opacity-40" />
              </div>
              <div>
                <p className="font-display font-bold text-text-primary text-sm mb-1">Enter a buy and sell price</p>
                <p className="text-text-muted text-xs leading-relaxed max-w-[200px] mx-auto">
                  Your profit, margin, and breakdown will appear here as you type.
                </p>
              </div>
            </div>
          ) : (
            /* Rating card */
            <div className={cn(
              "rounded-2xl border p-6 text-center relative overflow-hidden",
              result.rating === "excellent" ? "bg-emerald-950/30 border-emerald-800/20" :
              result.rating === "good"      ? "bg-green-950/30  border-green-800/20"    :
              result.rating === "decent"    ? "bg-amber-950/30  border-amber-800/20"    :
              result.rating === "bad"       ? "bg-orange-950/30 border-orange-800/20"   :
                                              "bg-red-950/30    border-red-800/20"
            )}>
              {/* Gauge */}
              <div className="w-32 h-32 mx-auto mb-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="65%" outerRadius="90%"
                    startAngle={220} endAngle={-40}
                    data={[{ value: 100, fill: "#1c1c28" }, ...marginGaugeData]}
                    barSize={10}
                  >
                    <RadialBar dataKey="value" cornerRadius={5} background={{ fill: "#1c1c28" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-xl font-display font-black", ratingColor)}>
                    {result.profitMargin.toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-text-muted uppercase tracking-wider">margin</span>
                </div>
              </div>

              <div className={cn("text-4xl font-display font-black mb-1 tracking-tight", ratingColor)}>
                {result.netProfit >= 0 ? "+" : ""}{formatCurrency(result.netProfit)}
              </div>
              <div className="text-text-secondary text-xs mb-3">Net Profit</div>
              <div className={cn(
                "inline-flex items-center gap-2 text-sm font-display font-bold px-3 py-1.5 rounded-full border",
                result.netProfit >= 0
                  ? "border-emerald-500/20 text-emerald-400 bg-emerald-950/20"
                  : "border-red-500/20 text-red-400 bg-red-950/20"
              )}>
                {result.netProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {getRatingLabel(result.rating)}
              </div>
            </div>
          )}

          {/* Breakdown — only shown when there's input */}
          {hasInput && (
            <Card>
              <h2 className="font-display font-bold text-text-primary text-sm mb-4">Cost Breakdown</h2>
              <div className="space-y-2">
                {[
                  { label: "Sale Price",    value:  v.sellPrice,    positive: true  },
                  { label: "Cost of Goods", value: -v.buyPrice,     positive: false },
                  { label: "Shipping",      value: -v.shippingCost, positive: false },
                  { label: `Platform Fee (${v.platformFeePercent}%)`, value: -result.platformFee, positive: false },
                  ...(v.taxes      > 0 ? [{ label: "Taxes",       value: -v.taxes,      positive: false }] : []),
                  ...(v.extraCosts > 0 ? [{ label: "Other Costs", value: -v.extraCosts, positive: false }] : []),
                ].map(({ label, value, positive }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#1c1c28] last:border-0 text-sm">
                    <span className={positive ? "text-text-primary font-semibold" : "text-text-secondary"}>{label}</span>
                    <span className={cn("font-mono font-bold text-sm", positive ? "text-text-primary" : "text-red-400/80")}>
                      {value < 0 ? `-${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-accent-red/20 flex justify-between items-center">
                <span className="font-display font-black text-text-primary text-sm uppercase tracking-wide">Net Profit</span>
                <span className={cn("font-mono font-black text-xl", result.netProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {result.netProfit >= 0 ? "+" : ""}{formatCurrency(result.netProfit)}
                </span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-text-muted">Total fees & costs</span>
                <span className="font-mono text-xs font-bold text-red-400/80">-{formatCurrency(result.totalFees + v.buyPrice)}</span>
              </div>
            </Card>
          )}

          {/* Margin guide — always visible as reference */}
          <div className="p-4 rounded-xl bg-[#0f0f17] border border-[#1c1c28]">
            <p className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap size={11} /> Margin Guide
            </p>
            <div className="space-y-1.5">
              {[
                { range: "30%+",   label: "Excellent",     color: "text-emerald-400", bar: "bg-emerald-400" },
                { range: "20–30%", label: "Good",          color: "text-green-400",   bar: "bg-green-400"   },
                { range: "10–20%", label: "Decent",        color: "text-amber-400",   bar: "bg-amber-400"   },
                { range: "0–10%",  label: "Thin Margins",  color: "text-orange-400",  bar: "bg-orange-400"  },
                { range: "< 0%",   label: "Taking a Loss", color: "text-red-400",     bar: "bg-red-400"     },
              ].map(({ range, label, color, bar }) => (
                <div key={range} className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", bar)} />
                  <span className={cn("text-xs font-semibold", color)}>{label}</span>
                  <span className="text-xs text-text-muted ml-auto font-mono">{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
