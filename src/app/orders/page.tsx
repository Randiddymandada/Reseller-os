"use client";
import { useEffect, useState, useMemo } from "react";
import { Plus, Search, X, Pencil, Trash2, ShoppingBag, ChevronDown, ExternalLink } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Input, Select, Modal, EmptyState, Textarea } from "@/components/ui";
import { useAppData } from "@/lib/useAppData";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Order, OrderStatus, PaymentMethod, Customer, InventoryItem } from "@/types";
import toast from "react-hot-toast";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import Link from "next/link";

const ORDER_STATUSES: OrderStatus[] = ["Pending","Paid","Packed","Shipped","Delivered","Cancelled"];
const PAYMENT_METHODS: PaymentMethod[] = ["Cash","PayPal","Venmo","Zelle","Card","Crypto","Other"];

const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Paid:      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Packed:    "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Shipped:   "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Delivered: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

const PAYMENT_STYLE: Record<string, string> = {
  PayPal: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Venmo:  "text-sky-400 bg-sky-400/10 border-sky-400/20",
  Cash:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Zelle:  "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Card:   "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Crypto: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Other:  "text-text-muted bg-[#14141e] border-[#1c1c28]",
};

const EMPTY_FORM = {
  customerName:"", customerId:"", itemName:"", itemId:"",
  salePrice:"", shippingCost:"0", paymentMethod:"PayPal" as PaymentMethod,
  status:"Pending" as OrderStatus, date: new Date().toISOString().split("T")[0],
  trackingNumber:"", notes:"",
};

export default function OrdersPage() {
  const {
    state: appState,
    loading: dataLoading,
    addOrder,
    updateOrder,
    deleteOrder,
    updateInventoryItem,
  } = useAppData();
  const orders   = appState?.orders    ?? [];
  const customers= appState?.customers ?? [];
  const inventory= appState?.inventory ?? [];
  const [modalOpen, setModalOpen]     = useState(false);
  const [editOrder, setEditOrder]     = useState<Order|null>(null);
  const [detailOrder, setDetailOrder] = useState<Order|null>(null);
  const [deleteId, setDeleteId]       = useState<string|null>(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [errors, setErrors]           = useState<Record<string,string>>({});
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<"All"|OrderStatus>("All");
  const [saving, setSaving]           = useState(false);


  const filtered = useMemo(() => {
    let list = [...orders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.itemName.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.trackingNumber||"").toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "All") list = list.filter(o => o.status === filterStatus);
    return list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, filterStatus]);

  const totalRevenue  = orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.salePrice+o.shippingCost,0);
  const pendingCount  = orders.filter(o=>["Pending","Paid","Packed"].includes(o.status)).length;
  const deliveredCount= orders.filter(o=>o.status==="Delivered").length;

  function validate() {
    const e: Record<string,string> = {};
    if (!form.customerName.trim()) e.customerName = "Customer name required";
    if (!form.itemName.trim())     e.itemName     = "Item name required";
    if (!form.salePrice || isNaN(Number(form.salePrice)) || Number(form.salePrice) <= 0) e.salePrice = "Valid price required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openAdd() { setEditOrder(null); setForm({ ...EMPTY_FORM }); setErrors({}); setModalOpen(true); }
  function openEdit(o: Order) {
    setEditOrder(o);
    setForm({
      customerName:o.customerName, customerId:o.customerId||"",
      itemName:o.itemName, itemId:o.itemId||"",
      salePrice:String(o.salePrice), shippingCost:String(o.shippingCost),
      paymentMethod:o.paymentMethod, status:o.status,
      date:o.date, trackingNumber:o.trackingNumber||"", notes:o.notes||"",
    });
    setErrors({}); setModalOpen(true);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,250));
    const data = {
      customerName:form.customerName, customerId:form.customerId||undefined,
      itemName:form.itemName, itemId:form.itemId||undefined,
      salePrice:parseFloat(form.salePrice), shippingCost:parseFloat(form.shippingCost)||0,
      paymentMethod:form.paymentMethod, status:form.status,
      date:form.date, trackingNumber:form.trackingNumber||undefined, notes:form.notes||undefined,
    };
    if (editOrder) {
      updateOrder(editOrder.id, data);
      if (data.itemId) {
        if (data.status==="Shipped")   updateInventoryItem(data.itemId, { status:"Shipped" });
        if (data.status==="Delivered") updateInventoryItem(data.itemId, { status:"Sold" });
      }
      toast.success("Order updated ✓");
    } else {
      addOrder(data);
      toast.success("Order created ✓");
    }
    setModalOpen(false); setSaving(false);
  }

  function handleDelete(id: string) {
    deleteOrder(id); setDeleteId(null);
    toast.success("Order deleted");
  }

  function handleQuickStatus(orderId: string, status: OrderStatus) {
    updateOrder(orderId, { status });
    const o = orders.find(o=>o.id===orderId);
    if (o?.itemId) {
      if (status==="Shipped")   updateInventoryItem(o.itemId, { status:"Shipped" });
      if (status==="Delivered") updateInventoryItem(o.itemId, { status:"Sold" });
    }
    toast.success(`Marked as ${status}`);
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const orderTotal = (parseFloat(form.salePrice)||0) + (parseFloat(form.shippingCost)||0);
  const custForOrder = (o: Order) => customers.find(c => c.id===o.customerId || c.name===o.customerName);

  return (
    <UpgradeGate feature="orders">
    <AppLayout>
      <PageHeader
        title="Orders"
        description={`${orders.length} total · ${pendingCount} active · ${deliveredCount} delivered`}
        action={<Button size="sm" onClick={openAdd}><Plus size={13} /> New Order</Button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label:"Total Orders",  value: orders.length },
          { label:"Active",        value: pendingCount },
          { label:"Delivered",     value: deliveredCount },
          { label:"Revenue",       value: formatCurrency(totalRevenue) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4">
            <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest mb-1.5">{label}</div>
            <div className="text-lg font-display font-black text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by customer, item, order #, tracking…"
              className="w-full bg-[#14141e] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/10 transition-all pl-10 pr-8 py-2.5"
            />
            {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X size={14}/></button>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["All",...ORDER_STATUSES] as const).map(s => (
              <button key={s} onClick={()=>setFilterStatus(s as any)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap",
                  filterStatus===s ? "bg-accent-red/10 border-accent-red/30 text-accent-red" : "bg-[#14141e] border-[#1c1c28] text-text-secondary hover:border-[#2a2a3a]"
                )}>{s}</button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={28} />}
            title={search||filterStatus!=="All" ? "No orders match" : "No orders yet"}
            description="Create your first order to start tracking your sales pipeline."
            action={!search&&filterStatus==="All"&&<Button onClick={openAdd}><Plus size={14}/>New Order</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1c1c28] bg-[#14141e]/60">
                  {["Order","Date","Customer","Item","Total","Payment","Status",""].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-display font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const tot = order.salePrice + order.shippingCost;
                  const cust = custForOrder(order);
                  return (
                    <tr key={order.id} className="border-b border-[#1c1c28]/60 last:border-0 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3.5">
                        <button onClick={()=>setDetailOrder(order)} className="font-mono text-[12px] font-bold text-accent-red hover:underline">{order.orderNumber}</button>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-muted whitespace-nowrap">{formatDate(order.date)}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-semibold text-text-primary">{order.customerName}</div>
                        {cust?.email && <div className="text-[10px] text-text-muted">{cust.email}</div>}
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]"><div className="text-xs text-text-secondary truncate">{order.itemName}</div></td>
                      <td className="px-4 py-3.5 text-[13px] font-bold font-mono text-emerald-400">{formatCurrency(tot)}</td>
                      <td className="px-4 py-3.5">
                        <Badge className={PAYMENT_STYLE[order.paymentMethod]||PAYMENT_STYLE.Other}>{order.paymentMethod}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {/* Inline status picker */}
                        <div className="relative group/st">
                          <button className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold transition-all", STATUS_STYLE[order.status])}>
                            {order.status}<ChevronDown size={10}/>
                          </button>
                          <div className="absolute top-full left-0 mt-1 z-20 bg-[#14141e] border border-[#1c1c28] rounded-xl py-1 shadow-xl hidden group-hover/st:block min-w-[120px]">
                            {ORDER_STATUSES.map(s=>(
                              <button key={s} onClick={()=>handleQuickStatus(order.id,s)}
                                className={cn("w-full text-left px-3 py-2 text-xs font-semibold hover:bg-[#1c1c28] transition-colors", order.status===s?"text-accent-red":"text-text-secondary")}>{s}</button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>setDetailOrder(order)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1c1c28] text-text-muted hover:text-text-primary transition-all"><ExternalLink size={12}/></button>
                          <button onClick={()=>openEdit(order)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1c1c28] text-text-muted hover:text-text-primary transition-all"><Pencil size={12}/></button>
                          <button onClick={()=>setDeleteId(order.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/20 text-text-muted hover:text-red-400 transition-all"><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#1c1c28] bg-[#14141e]/40">
                  <td colSpan={4} className="px-4 py-3 text-[11px] font-display font-bold text-text-muted uppercase tracking-wider">{filtered.length} orders</td>
                  <td className="px-4 py-3"><span className="text-sm font-mono font-black text-emerald-400">{formatCurrency(filtered.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.salePrice+o.shippingCost,0))}</span></td>
                  <td colSpan={3}/>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editOrder?"Edit Order":"New Order"} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-1.5">Customer</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <input value={form.customerName} onChange={e=>{ f("customerName",e.target.value); const c=customers.find(x=>x.name===e.target.value); if(c) f("customerId",c.id); }} placeholder="Customer name" list="clist"
                  className={cn("w-full bg-[#14141e] border rounded-lg text-text-primary text-sm py-2.5 px-3.5 placeholder:text-text-muted transition-all focus:outline-none focus:ring-2",
                    errors.customerName?"border-red-500/50 focus:ring-red-500/10":"border-[#1c1c28] hover:border-[#2a2a3a] focus:border-accent-red/50 focus:ring-accent-red/10")} />
                <datalist id="clist">{customers.map(c=><option key={c.id} value={c.name}/>)}</datalist>
              </div>
              <Link href="/customers"><Button variant="secondary" size="sm" className="h-[42px]"><Plus size={13}/>New</Button></Link>
            </div>
            {errors.customerName&&<span className="text-[11px] text-red-400">⚠ {errors.customerName}</span>}
          </div>

          <div className="sm:col-span-2">
            <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-1.5">Item Sold</div>
            <input value={form.itemName} list="ilist" placeholder="Type or select from inventory"
              onChange={e=>{ f("itemName",e.target.value); const m=inventory.find(i=>i.name===e.target.value); if(m){f("itemId",m.id);f("salePrice",String(m.expectedSellPrice));} }}
              className={cn("w-full bg-[#14141e] border rounded-lg text-text-primary text-sm py-2.5 px-3.5 placeholder:text-text-muted transition-all focus:outline-none focus:ring-2",
                errors.itemName?"border-red-500/50 focus:ring-red-500/10":"border-[#1c1c28] hover:border-[#2a2a3a] focus:border-accent-red/50 focus:ring-accent-red/10")} />
            <datalist id="ilist">{inventory.filter(i=>i.status!=="Sold"&&i.status!=="Shipped").map(i=><option key={i.id} value={i.name}/>)}</datalist>
            {errors.itemName&&<span className="text-[11px] text-red-400">⚠ {errors.itemName}</span>}
          </div>

          <Input label="Sale Price" prefix="$" type="number" min="0" step="0.01" value={form.salePrice} onChange={e=>f("salePrice",e.target.value)} error={errors.salePrice}/>
          <Input label="Shipping" prefix="$" type="number" min="0" step="0.01" value={form.shippingCost} onChange={e=>f("shippingCost",e.target.value)}/>
          <Select label="Payment Method" value={form.paymentMethod} onChange={e=>f("paymentMethod",e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e=>f("status",e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map(s=><option key={s}>{s}</option>)}
          </Select>
          <Input label="Date" type="date" value={form.date} onChange={e=>f("date",e.target.value)}/>
          <Input label="Tracking (optional)" value={form.trackingNumber} onChange={e=>f("trackingNumber",e.target.value)} placeholder="USPS, UPS, FedEx…"/>
          <div className="sm:col-span-2">
            <Textarea label="Notes (optional)" value={form.notes} onChange={e=>f("notes",e.target.value)} rows={2}/>
          </div>
          {form.salePrice&&(
            <div className="sm:col-span-2 p-3 rounded-xl bg-[#14141e] border border-[#1c1c28] flex justify-between items-center">
              <span className="text-xs text-text-muted">Order Total</span>
              <span className="font-display font-black text-lg text-emerald-400">{formatCurrency(orderTotal)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#1c1c28]">
          <Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editOrder?"Save Changes":"Create Order"}</Button>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailOrder} onClose={()=>setDetailOrder(null)} title="Order Details" maxWidth="max-w-md">
        {detailOrder&&(
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c1c28]">
              <span className="font-mono font-black text-accent-red">{detailOrder.orderNumber}</span>
              <Badge className={STATUS_STYLE[detailOrder.status]}>{detailOrder.status}</Badge>
            </div>
            {[
              {l:"Customer",  v:detailOrder.customerName},
              {l:"Item",      v:detailOrder.itemName},
              {l:"Sale Price",v:formatCurrency(detailOrder.salePrice)},
              {l:"Shipping",  v:formatCurrency(detailOrder.shippingCost)},
              {l:"Total",     v:formatCurrency(detailOrder.salePrice+detailOrder.shippingCost)},
              {l:"Payment",   v:detailOrder.paymentMethod},
              {l:"Date",      v:formatDate(detailOrder.date)},
              ...(detailOrder.trackingNumber?[{l:"Tracking",v:detailOrder.trackingNumber}]:[]),
              ...(detailOrder.notes?[{l:"Notes",v:detailOrder.notes}]:[]),
            ].map(({l,v})=>(
              <div key={l} className="flex justify-between items-start gap-4">
                <span className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider shrink-0">{l}</span>
                <span className="text-sm text-text-primary font-semibold text-right break-all">{v}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-3 border-t border-[#1c1c28]">
              <Button variant="secondary" className="flex-1" onClick={()=>{setDetailOrder(null);openEdit(detailOrder);}}>
                <Pencil size={13}/>Edit Order
              </Button>
              <Button variant="ghost" size="sm" onClick={()=>{setDetailOrder(null);setDeleteId(detailOrder.id);}} className="text-red-400 hover:bg-red-900/20">
                <Trash2 size={13}/>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title="Delete Order" maxWidth="max-w-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-red-400"/></div>
          <p className="text-text-secondary text-sm">This order will be permanently deleted and cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={()=>setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={()=>deleteId&&handleDelete(deleteId)}><Trash2 size={13}/>Delete</Button>
        </div>
      </Modal>
    </AppLayout>
    </UpgradeGate>
  );
}
