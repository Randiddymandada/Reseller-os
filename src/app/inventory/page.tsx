"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Plus, Search, Download, Pencil, Trash2, Package,
  ArrowUpDown, Receipt, ChevronUp, ChevronDown, X, SlidersHorizontal
} from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Input, Select, Modal, EmptyState, Textarea, StatCard } from "@/components/ui";
import { InventoryLimitBanner } from "@/components/ui/UpgradeGate";
import { usePlanLimits } from "@/lib/auth-context";
import { useAppData } from "@/lib/useAppData";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import type { InventoryItem, ItemStatus, ItemCondition } from "@/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  name: "", category: "", size: "", condition: "New" as ItemCondition,
  buyPrice: "", expectedSellPrice: "", quantity: "1", source: "",
  dateBought: new Date().toISOString().split("T")[0],
  status: "In Stock" as ItemStatus, notes: "",
};

const CONDITIONS: ItemCondition[] = ["New", "Like New", "Good", "Fair", "Poor"];
const STATUSES: ItemStatus[] = ["In Stock", "Listed", "Sold", "Shipped"];
const CATEGORIES = ["Sneakers","Streetwear","Electronics","Luxury Bags","Accessories","Trading Cards","Collectibles","Other"];

type SortKey = "name" | "buyPrice" | "expectedSellPrice" | "dateBought" | "updatedAt" | "profit";

const STATUS_STYLE: Record<string, string> = {
  "In Stock": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Listed":   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  "Sold":     "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Shipped":  "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function InventoryPage() {
  const router = useRouter();
  const { maxInventory } = usePlanLimits();
  const {
    state: appState,
    loading: dataLoading,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    exportCSV,
  } = useAppData();
  const items = appState?.inventory ?? [];
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [errors, setErrors]         = useState<Record<string,string>>({});
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterCondition, setFilterCondition] = useState("All");
  const [sortBy, setSortBy]         = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir]       = useState<"asc"|"desc">("desc");
  const [saving, setSaving]         = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);


  // ── Derived data ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q) ||
        i.condition.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "All")    list = list.filter(i => i.status === filterStatus);
    if (filterCategory !== "All")  list = list.filter(i => i.category === filterCategory);
    if (filterCondition !== "All") list = list.filter(i => i.condition === filterCondition);

    list.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortBy === "profit") {
        av = (a.expectedSellPrice - a.buyPrice) * a.quantity;
        bv = (b.expectedSellPrice - b.buyPrice) * b.quantity;
      } else {
        av = a[sortBy] as string | number;
        bv = b[sortBy] as string | number;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [items, search, filterStatus, filterCategory, filterCondition, sortBy, sortDir]);

  const activeItems  = items.filter(i => i.status !== "Sold" && i.status !== "Shipped");
  const soldItems    = items.filter(i => i.status === "Sold" || i.status === "Shipped");
  const totalValue   = activeItems.reduce((s, i) => s + i.buyPrice * i.quantity, 0);
  const expProfit    = activeItems.reduce((s, i) => s + (i.expectedSellPrice - i.buyPrice) * i.quantity, 0);
  const realizedProfit = soldItems.reduce((s, i) => s + (i.expectedSellPrice - i.buyPrice) * i.quantity, 0);

  const activeFilters = [filterStatus !== "All", filterCategory !== "All", filterCondition !== "All"].filter(Boolean).length;

  // ── Actions ───────────────────────────────────────────────────
  function openAdd() { setEditItem(null); setForm({ ...EMPTY_FORM }); setErrors({}); setModalOpen(true); }
  function openEdit(item: InventoryItem) {
    setEditItem(item);
    setForm({
      name: item.name, category: item.category, size: item.size,
      condition: item.condition, buyPrice: String(item.buyPrice),
      expectedSellPrice: String(item.expectedSellPrice),
      quantity: String(item.quantity), source: item.source,
      dateBought: item.dateBought, status: item.status, notes: item.notes || "",
    });
    setErrors({}); setModalOpen(true);
  }

  function validate() {
    const e: Record<string,string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.category)    e.category = "Required";
    if (!form.buyPrice || isNaN(Number(form.buyPrice)) || Number(form.buyPrice) < 0) e.buyPrice = "Enter a valid price";
    if (!form.expectedSellPrice || isNaN(Number(form.expectedSellPrice))) e.expectedSellPrice = "Enter a valid price";
    if (!form.quantity || Number(form.quantity) < 1) e.quantity = "Min 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const data = {
      name: form.name, category: form.category, size: form.size || "N/A",
      condition: form.condition, buyPrice: parseFloat(form.buyPrice),
      expectedSellPrice: parseFloat(form.expectedSellPrice),
      quantity: parseInt(form.quantity), source: form.source,
      dateBought: form.dateBought, status: form.status, notes: form.notes,
    };
    await new Promise(r => setTimeout(r, 250));
    if (editItem) { updateInventoryItem(editItem.id, data); toast.success("Item updated ✓"); }
    else          { addInventoryItem(data); toast.success("Item added to inventory ✓"); }
    setModalOpen(false); setSaving(false);
  }

  function handleDelete(id: string) {
    deleteInventoryItem(id); setDeleteId(null);
    toast.success("Item removed");
  }

  function handleCSV() {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  function handleMarkSold(item: InventoryItem) {
    updateInventoryItem(item.id, { status: "Sold" });
    router.push(`/receipts?item=${encodeURIComponent(item.name)}&price=${item.expectedSellPrice}`);
  }

  function toggleSort(col: SortKey) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  function clearFilters() {
    setFilterStatus("All"); setFilterCategory("All"); setFilterCondition("All"); setSearch("");
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const previewProfit = (parseFloat(form.expectedSellPrice) || 0) - (parseFloat(form.buyPrice) || 0);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ArrowUpDown size={11} className="opacity-40" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-accent-red" /> : <ChevronDown size={12} className="text-accent-red" />;
  };

  const ColHead = ({ label, col }: { label: string; col?: SortKey }) => (
    <th className="px-4 py-3 text-left whitespace-nowrap">
      {col ? (
        <button
          onClick={() => toggleSort(col)}
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-wider transition-colors",
            sortBy === col ? "text-accent-red" : "text-text-muted hover:text-text-secondary"
          )}
        >
          {label} <SortIcon col={col} />
        </button>
      ) : (
        <span className="text-[11px] font-display font-bold text-text-muted uppercase tracking-wider">{label}</span>
      )}
    </th>
  );

  return (
    <AppLayout>
      <PageHeader
        title="Inventory"
        description={`${items.length} items tracked · ${activeItems.length} active`}
        action={
          <>
            <Button variant="secondary" size="sm" onClick={handleCSV}><Download size={13} /> Export CSV</Button>
            <Button size="sm" onClick={openAdd} disabled={items.length >= maxInventory && maxInventory !== Infinity}><Plus size={13} /> Add Item</Button>
          </>
        }
      />

      <InventoryLimitBanner count={items.length} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Items",      value: items.reduce((s,i)=>s+i.quantity,0) },
          { label: "Active",           value: activeItems.length },
          { label: "Invested Value",   value: formatCurrency(totalValue) },
          { label: "Expected Profit",  value: formatCurrency(expProfit) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4">
            <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest mb-1.5">{label}</div>
            <div className="text-lg font-display font-black text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, category, source, condition…"
              className="w-full bg-[#14141e] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/10 transition-all pl-10 pr-8 py-2.5"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={14} />
              </button>
            )}
          </div>
          {/* Filter toggle */}
          <Button
            variant="secondary" size="sm"
            onClick={() => setFiltersOpen(o => !o)}
            className={cn(filtersOpen && "border-accent-red/40 text-accent-red")}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-black flex items-center justify-center">{activeFilters}</span>
            )}
          </Button>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="mt-3 pt-3 border-t border-[#1c1c28] flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-display font-bold text-text-muted uppercase tracking-wider block mb-1.5">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-[#14141e] border border-[#1c1c28] rounded-lg text-text-secondary text-sm py-2 px-3 focus:outline-none focus:border-accent-red/50 cursor-pointer">
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-display font-bold text-text-muted uppercase tracking-wider block mb-1.5">Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="w-full bg-[#14141e] border border-[#1c1c28] rounded-lg text-text-secondary text-sm py-2 px-3 focus:outline-none focus:border-accent-red/50 cursor-pointer">
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-display font-bold text-text-muted uppercase tracking-wider block mb-1.5">Condition</label>
              <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)}
                className="w-full bg-[#14141e] border border-[#1c1c28] rounded-lg text-text-secondary text-sm py-2 px-3 focus:outline-none focus:border-accent-red/50 cursor-pointer">
                <option value="All">All Conditions</option>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-accent-red h-9">
                <X size={12} /> Clear all
              </Button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {(filterStatus !== "All" || filterCategory !== "All" || filterCondition !== "All" || search) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#1c1c28]">
            <span className="text-[10px] text-text-muted self-center">Active filters:</span>
            {search && (
              <button onClick={() => setSearch("")} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-red/10 border border-accent-red/20 text-accent-red text-[11px] font-semibold hover:bg-accent-red/20 transition-colors">
                "{search}" <X size={10} />
              </button>
            )}
            {filterStatus !== "All" && (
              <button onClick={() => setFilterStatus("All")} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#14141e] border border-[#1c1c28] text-text-secondary text-[11px] font-semibold hover:border-[#2a2a3a] transition-colors">
                {filterStatus} <X size={10} />
              </button>
            )}
            {filterCategory !== "All" && (
              <button onClick={() => setFilterCategory("All")} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#14141e] border border-[#1c1c28] text-text-secondary text-[11px] font-semibold hover:border-[#2a2a3a] transition-colors">
                {filterCategory} <X size={10} />
              </button>
            )}
            {filterCondition !== "All" && (
              <button onClick={() => setFilterCondition("All")} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#14141e] border border-[#1c1c28] text-text-secondary text-[11px] font-semibold hover:border-[#2a2a3a] transition-colors">
                {filterCondition} <X size={10} />
              </button>
            )}
            <span className="text-[10px] text-text-muted self-center ml-1">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title={search || activeFilters > 0 ? "No matches found" : "Your inventory is empty"}
            description={search || activeFilters > 0 ? "Try adjusting your search or filters." : "Add your first item to start tracking your reselling operation."}
            action={
              search || activeFilters > 0
                ? <Button variant="secondary" onClick={clearFilters}><X size={14} /> Clear filters</Button>
                : <Button onClick={openAdd}><Plus size={14} /> Add First Item</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1c1c28] bg-[#14141e]/60">
                  <ColHead label="Item"       col="name" />
                  <ColHead label="Category" />
                  <ColHead label="Condition" />
                  <ColHead label="Qty" />
                  <ColHead label="Buy"        col="buyPrice" />
                  <ColHead label="Sell"       col="expectedSellPrice" />
                  <ColHead label="Profit"     col="profit" />
                  <ColHead label="Status" />
                  <ColHead label="Date"       col="dateBought" />
                  <ColHead label="" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const profit    = (item.expectedSellPrice - item.buyPrice) * item.quantity;
                  const profitPct = item.buyPrice > 0 ? ((item.expectedSellPrice - item.buyPrice) / item.buyPrice * 100) : 0;
                  return (
                    <tr key={item.id} className="border-b border-[#1c1c28]/60 last:border-0 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-text-primary text-[13px] max-w-[200px] truncate">{item.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {item.size !== "N/A" ? `Size ${item.size}` : "—"} · {item.source || "Unknown source"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-text-secondary bg-[#14141e] border border-[#1c1c28] px-2 py-0.5 rounded-md">{item.category}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-secondary">{item.condition}</td>
                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-text-primary">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-text-secondary">{formatCurrency(item.buyPrice)}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-text-primary font-semibold">{formatCurrency(item.expectedSellPrice)}</td>
                      <td className="px-4 py-3.5">
                        <div className={cn("text-xs font-bold font-mono", profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                        </div>
                        <div className={cn("text-[10px] font-semibold", profitPct >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                          {profitPct >= 0 ? "+" : ""}{profitPct.toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={STATUS_STYLE[item.status]}>{item.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-muted whitespace-nowrap">{formatDate(item.dateBought)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.status !== "Sold" && item.status !== "Shipped" && (
                            <button
                              onClick={() => handleMarkSold(item)}
                              title="Mark sold & create receipt"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-400/10 text-text-muted hover:text-emerald-400 transition-all"
                            >
                              <Receipt size={13} />
                            </button>
                          )}
                          <button onClick={() => openEdit(item)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1c1c28] text-text-muted hover:text-text-primary transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteId(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/20 text-text-muted hover:text-red-400 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[#1c1c28] bg-[#14141e]/40">
                    <td className="px-4 py-3 text-[11px] font-display font-bold text-text-muted uppercase tracking-wider" colSpan={3}>
                      {filtered.length} items shown
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-text-primary">
                      {filtered.reduce((s,i)=>s+i.quantity,0)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary">
                      {formatCurrency(filtered.reduce((s,i)=>s+i.buyPrice*i.quantity,0))}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-text-primary">
                      {formatCurrency(filtered.reduce((s,i)=>s+i.expectedSellPrice*i.quantity,0))}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const tot = filtered.reduce((s,i)=>s+(i.expectedSellPrice-i.buyPrice)*i.quantity,0);
                        return <span className={cn("text-xs font-bold font-mono", tot>=0?"text-emerald-400":"text-red-400")}>{tot>=0?"+":""}{formatCurrency(tot)}</span>;
                      })()}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>

      {/* ── Add/Edit Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Item" : "Add Item to Inventory"} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Item Name" value={form.name} onChange={e => f("name", e.target.value)}
              placeholder="e.g. Nike Air Jordan 4 Retro 'Military Blue'" error={errors.name} />
          </div>
          <Select label="Category" value={form.category} onChange={e => f("category", e.target.value)} error={errors.category}>
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Size" value={form.size} onChange={e => f("size", e.target.value)}
            placeholder="e.g. 10.5, M, XL, N/A" />
          <Select label="Condition" value={form.condition} onChange={e => f("condition", e.target.value as ItemCondition)}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => f("status", e.target.value as ItemStatus)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
          <Input label="Buy Price" prefix="$" type="number" step="0.01" min="0"
            value={form.buyPrice} onChange={e => f("buyPrice", e.target.value)}
            placeholder="0.00" error={errors.buyPrice} />
          <Input label="Expected Sell Price" prefix="$" type="number" step="0.01" min="0"
            value={form.expectedSellPrice} onChange={e => f("expectedSellPrice", e.target.value)}
            placeholder="0.00" error={errors.expectedSellPrice} />
          <Input label="Quantity" type="number" min="1"
            value={form.quantity} onChange={e => f("quantity", e.target.value)}
            error={errors.quantity} hint="How many units?" />
          <Input label="Source / Platform" value={form.source}
            onChange={e => f("source", e.target.value)} placeholder="e.g. SNKRS, eBay, Local" />
          <Input label="Date Bought" type="date" value={form.dateBought}
            onChange={e => f("dateBought", e.target.value)} />
          <div className="sm:col-span-2">
            <Textarea label="Notes (optional)" value={form.notes}
              onChange={e => f("notes", e.target.value)}
              placeholder="Tags, condition details, tracking number…" rows={2} />
          </div>

          {/* Live profit preview */}
          {form.buyPrice && form.expectedSellPrice && (
            <div className={cn(
              "sm:col-span-2 p-4 rounded-xl border flex items-center justify-between",
              previewProfit >= 0
                ? "bg-emerald-950/30 border-emerald-900/30"
                : "bg-red-950/30 border-red-900/30"
            )}>
              <div>
                <div className="text-[10px] font-display font-bold uppercase tracking-wider text-text-muted mb-0.5">Estimated Profit</div>
                <div className={cn("text-xl font-display font-black", previewProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {previewProfit >= 0 ? "+" : ""}{formatCurrency(previewProfit)}
                </div>
              </div>
              {form.buyPrice && parseFloat(form.buyPrice) > 0 && (
                <div className="text-right">
                  <div className="text-[10px] font-display font-bold uppercase tracking-wider text-text-muted mb-0.5">ROI</div>
                  <div className={cn("text-xl font-display font-black", previewProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {((previewProfit / parseFloat(form.buyPrice)) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#1c1c28]">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {editItem ? "Save Changes" : "Add to Inventory"}
          </Button>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Item">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-text-primary font-semibold text-sm mb-1">Are you sure?</p>
            <p className="text-text-secondary text-sm">This item will be permanently removed from your inventory. This cannot be undone.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}><Trash2 size={14} /> Delete Item</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
