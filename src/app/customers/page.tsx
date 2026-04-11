"use client";
import { useEffect, useState, useMemo } from "react";
import { Plus, Search, X, Pencil, Trash2, Users, Mail, Phone, ShoppingBag } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button, Card, Modal, Input, EmptyState, Textarea, Badge } from "@/components/ui";
import { useAppData } from "@/lib/useAppData";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Customer, Order } from "@/types";
import toast from "react-hot-toast";
import { UpgradeGate } from "@/components/ui/UpgradeGate";

const EMPTY_FORM = { name:"", email:"", phone:"", notes:"" };

export default function CustomersPage() {
  const {
    state: appState,
    loading: dataLoading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useAppData();
  const customers = appState?.customers ?? [];
  const orders    = appState?.orders    ?? [];
  const [modalOpen, setModalOpen]   = useState(false);
  const [editCust, setEditCust]     = useState<Customer|null>(null);
  const [detailCust, setDetailCust] = useState<Customer|null>(null);
  const [deleteId, setDeleteId]     = useState<string|null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [errors, setErrors]         = useState<Record<string,string>>({});
  const [search, setSearch]         = useState("");
  const [saving, setSaving]         = useState(false);


  const filtered = useMemo(() => {
    if (!search) return [...customers].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone||"").includes(q)
    );
  }, [customers, search]);

  function ordersForCustomer(c: Customer) {
    return orders.filter(o => o.customerId===c.id || o.customerName===c.name);
  }
  function totalSpent(c: Customer) {
    return ordersForCustomer(c).filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.salePrice+o.shippingCost,0);
  }

  function validate() {
    const e: Record<string,string> = {};
    if (!form.name.trim())  e.name  = "Name required";
    if (!form.email.trim()) e.email = "Email required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function openAdd() { setEditCust(null); setForm({ ...EMPTY_FORM }); setErrors({}); setModalOpen(true); }
  function openEdit(c: Customer) {
    setEditCust(c);
    setForm({ name:c.name, email:c.email, phone:c.phone||"", notes:c.notes||"" });
    setErrors({}); setModalOpen(true);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,250));
    const data = { name:form.name, email:form.email, phone:form.phone||undefined, notes:form.notes||undefined };
    if (editCust) { updateCustomer(editCust.id, data); toast.success("Customer updated ✓"); }
    else          { addCustomer(data); toast.success("Customer added ✓"); }
    setModalOpen(false); setSaving(false);
  }

  function handleDelete(id: string) {
    deleteCustomer(id); setDeleteId(null);
    toast.success("Customer removed");
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const totalCustomers  = customers.length;
  const totalOrders     = orders.length;
  const totalRevenue    = orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.salePrice+o.shippingCost,0);
  const repeatBuyers    = customers.filter(c=>ordersForCustomer(c).length>1).length;

  return (
    <UpgradeGate feature="orders">
    <AppLayout>
      <PageHeader
        title="Customers"
        description={`${totalCustomers} customers · ${repeatBuyers} repeat buyers`}
        action={<Button size="sm" onClick={openAdd}><Plus size={13}/>Add Customer</Button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label:"Customers",    value: totalCustomers },
          { label:"Repeat Buyers",value: repeatBuyers },
          { label:"Total Orders", value: totalOrders },
          { label:"Total Revenue",value: formatCurrency(totalRevenue) },
        ].map(({label,value}) => (
          <div key={label} className="bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4">
            <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest mb-1.5">{label}</div>
            <div className="text-lg font-display font-black text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, or phone…"
            className="w-full bg-[#14141e] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/10 transition-all pl-10 pr-8 py-2.5"
          />
          {search&&<button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><X size={14}/></button>}
        </div>
      </Card>

      {/* Customer grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Users size={28}/>}
            title={search ? "No customers match" : "No customers yet"}
            description="Add your first customer to build your buyer database."
            action={!search&&<Button onClick={openAdd}><Plus size={14}/>Add Customer</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cust => {
            const custOrders = ordersForCustomer(cust);
            const spent = totalSpent(cust);
            const isRepeat = custOrders.length > 1;
            return (
              <div key={cust.id} className="bg-[#0f0f17] border border-[#1c1c28] rounded-2xl p-5 hover:border-[#2a2a3a] transition-all duration-150 group card-hover cursor-pointer"
                onClick={()=>setDetailCust(cust)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red font-black text-sm shrink-0">
                      {cust.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-display font-bold text-text-primary text-[14px]">{cust.name}</div>
                      {isRepeat && <Badge className="text-emerald-400 bg-emerald-400/10 border-emerald-400/20 mt-0.5">Repeat</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>openEdit(cust)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1c1c28] text-text-muted hover:text-text-primary transition-all"><Pencil size={12}/></button>
                    <button onClick={()=>setDeleteId(cust.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/20 text-text-muted hover:text-red-400 transition-all"><Trash2 size={12}/></button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Mail size={11} className="text-text-muted shrink-0"/>
                    <span className="truncate">{cust.email}</span>
                  </div>
                  {cust.phone&&(
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Phone size={11} className="text-text-muted shrink-0"/>
                      <span>{cust.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1c1c28]">
                  <div>
                    <div className="text-[9px] font-display font-black text-text-muted uppercase tracking-wider mb-0.5">Orders</div>
                    <div className="text-sm font-display font-black text-text-primary">{custOrders.length}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-display font-black text-text-muted uppercase tracking-wider mb-0.5">Total Spent</div>
                    <div className="text-sm font-display font-black text-emerald-400">{formatCurrency(spent)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editCust?"Edit Customer":"Add Customer"} maxWidth="max-w-md">
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={e=>f("name",e.target.value)} placeholder="e.g. Marcus Thompson" error={errors.name}/>
          <Input label="Email Address" type="email" value={form.email} onChange={e=>f("email",e.target.value)} placeholder="marcus@email.com" error={errors.email}/>
          <Input label="Phone (optional)" value={form.phone} onChange={e=>f("phone",e.target.value)} placeholder="(310) 555-0000"/>
          <Textarea label="Notes (optional)" value={form.notes} onChange={e=>f("notes",e.target.value)} placeholder="Preferences, shipping notes, etc." rows={3}/>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#1c1c28]">
          <Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editCust?"Save Changes":"Add Customer"}</Button>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detailCust} onClose={()=>setDetailCust(null)} title="Customer Profile" maxWidth="max-w-md">
        {detailCust&&(()=>{
          const custOrders = ordersForCustomer(detailCust);
          const spent = totalSpent(detailCust);
          return (
            <div>
              <div className="flex items-center gap-4 pb-5 mb-5 border-b border-[#1c1c28]">
                <div className="w-14 h-14 rounded-2xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red font-black text-lg">
                  {detailCust.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-text-primary">{detailCust.name}</h3>
                  <p className="text-text-muted text-xs">Customer since {formatDate(detailCust.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {l:"Orders",       v:String(custOrders.length)},
                  {l:"Total Spent",  v:formatCurrency(spent)},
                ].map(({l,v})=>(
                  <div key={l} className="bg-[#14141e] border border-[#1c1c28] rounded-xl p-3">
                    <div className="text-[9px] font-display font-black text-text-muted uppercase tracking-wider mb-0.5">{l}</div>
                    <div className="text-base font-display font-black text-text-primary">{v}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-5">
                {[
                  {icon:<Mail size={13}/>, v:detailCust.email},
                  ...(detailCust.phone?[{icon:<Phone size={13}/>,v:detailCust.phone}]:[]),
                ].map(({icon,v},i)=>(
                  <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-text-muted">{icon}</span>{v}
                  </div>
                ))}
                {detailCust.notes&&<p className="text-xs text-text-muted bg-[#14141e] rounded-lg px-3 py-2 border border-[#1c1c28]">{detailCust.notes}</p>}
              </div>

              {custOrders.length > 0 && (
                <div>
                  <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-2">Order History</div>
                  <div className="space-y-2">
                    {custOrders.slice(0,4).map(o=>(
                      <div key={o.id} className="flex items-center justify-between bg-[#14141e] rounded-xl px-3 py-2.5 border border-[#1c1c28]">
                        <div>
                          <div className="text-xs font-bold text-text-primary truncate max-w-[180px]">{o.itemName}</div>
                          <div className="text-[10px] text-text-muted font-mono">{o.orderNumber}</div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-xs font-bold text-emerald-400">{formatCurrency(o.salePrice+o.shippingCost)}</div>
                          <Badge className={
                            o.status==="Delivered"?"text-emerald-400 bg-emerald-400/10 border-emerald-400/20":
                            o.status==="Shipped"?"text-purple-400 bg-purple-400/10 border-purple-400/20":
                            "text-amber-400 bg-amber-400/10 border-amber-400/20"
                          }>{o.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-5 pt-4 border-t border-[#1c1c28]">
                <Button variant="secondary" className="flex-1" onClick={()=>{setDetailCust(null);openEdit(detailCust);}}>
                  <Pencil size={13}/>Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={()=>{setDetailCust(null);setDeleteId(detailCust.id);}} className="text-red-400 hover:bg-red-900/20">
                  <Trash2 size={13}/>
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title="Remove Customer" maxWidth="max-w-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-red-400"/></div>
          <p className="text-text-secondary text-sm">This customer will be permanently removed. Their orders will remain.</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={()=>setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={()=>deleteId&&handleDelete(deleteId)}><Trash2 size={13}/>Remove</Button>
        </div>
      </Modal>
    </AppLayout>
    </UpgradeGate>
  );
}
