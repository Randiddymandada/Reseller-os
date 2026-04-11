"use client";
import { useEffect, useState } from "react";
import { Package, DollarSign, TrendingUp, ShoppingBag, ArrowRight, Sparkles, Target, Users } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { StatCard, Card, Badge, SectionHeader } from "@/components/ui";
import { useAppData } from "@/lib/useAppData";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import Link from "next/link";
import type { AppState } from "@/types";

function buildMonthlyData(state: AppState) {
  const map: Record<string, { revenue: number; profit: number }> = {};
  for (const item of state.inventory) {
    if (item.status !== "Sold" && item.status !== "Shipped") continue;
    const d   = new Date(item.updatedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    if (!map[key]) map[key] = { revenue:0, profit:0 };
    map[key].revenue += item.expectedSellPrice * item.quantity;
    map[key].profit  += (item.expectedSellPrice - item.buyPrice) * item.quantity;
  }
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return Object.entries(map)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key,vals]) => ({ month: months[parseInt(key.slice(5))-1], ...vals }));
}

function buildCategoryData(state: AppState) {
  const map: Record<string,number> = {};
  for (const item of state.inventory) map[item.category] = (map[item.category]||0)+item.quantity;
  return Object.entries(map).sort(([,a],[,b])=>b-a).slice(0,5).map(([cat,count])=>({cat,count}));
}

const CATEGORY_COLORS = ["#e63946","#4361ee","#2a9d8f","#f4a261","#a855f7"];

const ChartTip = ({ active, payload, label }: any) => {
  if (!active||!payload?.length) return null;
  return (
    <div className="bg-[#14141e] border border-[#1c1c28] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[11px] text-text-muted font-display font-bold uppercase tracking-wider mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{background:p.color}}/>
          <span className="text-text-secondary capitalize">{p.name}:</span>
          <span className="font-bold text-text-primary font-mono">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const BarTip = ({ active, payload, label }: any) => {
  if (!active||!payload?.length) return null;
  return (
    <div className="bg-[#14141e] border border-[#1c1c28] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-text-primary">{label}</p>
      <p className="text-xs text-text-secondary mt-1">{payload[0].value} items</p>
    </div>
  );
};

export default function DashboardPage() {
  const { state, loading } = useAppData();
  const { user, isDemo } = useAuth();

  if (loading || !state) return (
    <AppLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_,i)=><div key={i} className="h-28 shimmer rounded-2xl"/>)}
      </div>
    </AppLayout>
  );

  const { inventory, receipts, customers, orders, settings } = state;
  // Use authenticated user name when available, fall back to profile settings, then email
  const rawName = user?.user_metadata?.full_name || settings.name || user?.email?.split("@")[0] || "there";
  const firstName = rawName.split(" ")[0];

  const activeItems    = inventory.filter(i=>i.status!=="Sold"&&i.status!=="Shipped");
  const soldItems      = inventory.filter(i=>i.status==="Sold"||i.status==="Shipped");
  const totalQty       = inventory.reduce((s,i)=>s+i.quantity,0);
  const invested       = activeItems.reduce((s,i)=>s+i.buyPrice*i.quantity,0);
  const totalRevenue   = soldItems.reduce((s,i)=>s+i.expectedSellPrice*i.quantity,0);
  const totalProfit    = soldItems.reduce((s,i)=>s+(i.expectedSellPrice-i.buyPrice)*i.quantity,0);
  const avgMargin      = totalRevenue>0?((totalProfit/totalRevenue)*100).toFixed(1):"—";
  const potentialProfit= activeItems.reduce((s,i)=>s+(i.expectedSellPrice-i.buyPrice)*i.quantity,0);

  const activeOrders   = orders.filter(o=>["Pending","Paid","Packed","Shipped"].includes(o.status));
  const deliveredOrders= orders.filter(o=>o.status==="Delivered");
  const orderRevenue   = orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.salePrice+o.shippingCost,0);

  // Low stock = In Stock with qty === 1
  const lowStock = inventory.filter(i=>i.status==="In Stock"&&i.quantity<=1);

  // Top items by profit
  const topItems = [...soldItems].sort((a,b)=>(b.expectedSellPrice-b.buyPrice)-(a.expectedSellPrice-a.buyPrice)).slice(0,4);

  const monthlyData  = buildMonthlyData(state);
  const categoryData = buildCategoryData(state);
  const recentOrders = [...orders].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,5);

  const statusCounts = {
    "In Stock": inventory.filter(i=>i.status==="In Stock").length,
    "Listed":   inventory.filter(i=>i.status==="Listed").length,
    "Sold":     inventory.filter(i=>i.status==="Sold").length,
    "Shipped":  inventory.filter(i=>i.status==="Shipped").length,
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-accent-amber"/>
          <span className="text-xs text-text-muted font-semibold">
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </span>
        </div>
        <h1 className="font-display font-black text-[22px] text-text-primary tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="text-text-secondary text-sm mt-1">Here's what's happening with your reselling operation.</p>
      </div>

      {/* KPI Cards — now 6 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5 stagger">
        <StatCard label="Active Stock"    value={totalQty}                sub={`${formatCurrency(invested)} invested`}        icon={<Package size={16}/>}    color="blue"  />
        <StatCard label="Sold / Shipped"  value={soldItems.length}        sub={`${soldItems.reduce((s,i)=>s+i.quantity,0)} units`} icon={<ShoppingBag size={16}/>} color="amber" />
        <StatCard label="Active Orders"   value={activeOrders.length}     sub={`${deliveredOrders.length} delivered`}          icon={<ShoppingBag size={16}/>} color="amber" />
        <StatCard label="Customers"       value={customers.length}        sub={`${orders.length} orders placed`}              icon={<Users size={16}/>}      color="blue"  />
        <StatCard label="Revenue"         value={formatCurrency(totalRevenue)} sub={`${avgMargin}% avg margin`}               icon={<DollarSign size={16}/>}  color="green" />
        <StatCard label="Net Profit"      value={formatCurrency(totalProfit)} sub={`${formatCurrency(potentialProfit)} potential`} icon={<TrendingUp size={16}/>} color="red"  />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <SectionHeader title="Revenue & Profit" subtitle="Last 6 months"
            action={
              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"/>Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-red"/>Profit</span>
              </div>
            }
          />
          {monthlyData.length>0?(
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={monthlyData} margin={{top:8,right:4,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#4361ee" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#4361ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#e63946" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#e63946" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c28" vertical={false}/>
                <XAxis dataKey="month" tick={{fill:"#4a4a62",fontSize:11,fontFamily:"DM Sans"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#4a4a62",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} width={52}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey="revenue" stroke="#4361ee" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{r:4,fill:"#4361ee",stroke:"#0f0f17",strokeWidth:2}}/>
                <Area type="monotone" dataKey="profit"  stroke="#e63946" strokeWidth={2} fill="url(#profGrad)" dot={false} activeDot={{r:4,fill:"#e63946",stroke:"#0f0f17",strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          ):(
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <TrendingUp size={32} className="text-text-muted opacity-30"/>
              <p className="text-text-muted text-sm">No sales data yet</p>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <SectionHeader title="Status Breakdown" subtitle={`${totalQty} total items`}/>
            <div className="space-y-3">
              {(["In Stock","Listed","Sold","Shipped"] as const).map(s=>{
                const count = statusCounts[s];
                const pct   = totalQty>0?(count/totalQty)*100:0;
                const barColors: Record<string,string> = {"In Stock":"bg-blue-400","Listed":"bg-amber-400","Sold":"bg-emerald-400","Shipped":"bg-purple-400"};
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-secondary font-medium">{s}</span>
                      <span className="text-text-primary font-bold font-mono">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#1c1c28] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700",barColors[s])} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-accent-red/8 to-transparent border-accent-red/15">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-red/15 border border-accent-red/20 flex items-center justify-center shrink-0">
                <Target size={16} className="text-accent-red"/>
              </div>
              <div>
                <p className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-1">Unrealized</p>
                <p className="text-xl font-display font-black text-accent-red">{formatCurrency(potentialProfit)}</p>
                <p className="text-[11px] text-text-muted mt-0.5">if all active items sell</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Category chart */}
        <Card>
          <SectionHeader title="Categories" subtitle="By item count"/>
          {categoryData.length>0?(
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryData} margin={{top:4,right:0,bottom:0,left:-28}} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c28" horizontal={false}/>
                <XAxis dataKey="cat" tick={{fill:"#4a4a62",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#4a4a62",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<BarTip/>} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {categoryData.map((_,i)=><Cell key={i} fill={CATEGORY_COLORS[i%CATEGORY_COLORS.length]} fillOpacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ):(
            <div className="h-40 flex items-center justify-center text-text-muted text-sm">No data</div>
          )}
        </Card>

        {/* Recent orders */}
        <Card>
          <SectionHeader title="Recent Orders"
            action={<Link href="/orders" className="text-[11px] text-accent-red hover:underline font-semibold">View all →</Link>}
          />
          <div className="space-y-1">
            {recentOrders.map(o=>(
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#1c1c28] last:border-0">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-text-primary truncate">{o.customerName}</div>
                  <div className="text-[10px] text-text-muted font-mono">{o.orderNumber}</div>
                </div>
                <div className="shrink-0 ml-2 text-right">
                  <div className="text-xs font-bold text-emerald-400">{formatCurrency(o.salePrice+o.shippingCost)}</div>
                  <span className={cn("text-[9px] font-bold",
                    o.status==="Delivered"?"text-emerald-400":o.status==="Cancelled"?"text-red-400":"text-amber-400"
                  )}>{o.status}</span>
                </div>
              </div>
            ))}
            {recentOrders.length===0&&<p className="text-text-muted text-xs text-center py-4">No orders yet</p>}
          </div>
        </Card>

        {/* Low stock */}
        <Card>
          <SectionHeader title="Low Stock" subtitle="Qty ≤ 1 in stock"
            action={<Link href="/inventory" className="text-[11px] text-accent-red hover:underline font-semibold">Manage →</Link>}
          />
          <div className="space-y-1">
            {lowStock.slice(0,5).map(item=>(
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#1c1c28] last:border-0">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-text-primary truncate">{item.name}</div>
                  <div className="text-[10px] text-text-muted">{item.category}</div>
                </div>
                <Badge className="text-orange-400 bg-orange-400/10 border-orange-400/20 shrink-0 ml-2">Qty {item.quantity}</Badge>
              </div>
            ))}
            {lowStock.length===0&&<p className="text-text-muted text-xs text-center py-4">All items stocked well</p>}
          </div>
        </Card>

        {/* Top items */}
        <Card>
          <SectionHeader title="Top Earners" subtitle="Sold items by profit"/>
          <div className="space-y-1">
            {topItems.map((item,i)=>{
              const profit = item.expectedSellPrice - item.buyPrice;
              return (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[#1c1c28] last:border-0">
                  <span className="text-[11px] font-black text-text-muted w-4 shrink-0">#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-text-primary truncate">{item.name}</div>
                    <div className="text-[10px] text-text-muted">{item.category}</div>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 shrink-0">+{formatCurrency(profit)}</div>
                </div>
              );
            })}
            {topItems.length===0&&<p className="text-text-muted text-xs text-center py-4">No sold items yet</p>}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
