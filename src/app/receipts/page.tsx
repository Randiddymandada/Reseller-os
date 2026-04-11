"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Download, Search, FileText, ExternalLink, CheckCircle, X } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button, Card, Modal, Input, Select, EmptyState, Badge, SectionHeader } from "@/components/ui";
import { useAppData } from "@/lib/useAppData";
import { getState } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/pdf";
import type { Receipt, PaymentMethod } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS: PaymentMethod[] = ["Cash","PayPal","Venmo","Zelle","Card","Crypto","Other"];
const EMPTY_FORM = {
  customerName: "", customerEmail: "", itemName: "",
  salePrice: "", shippingCost: "0", tax: "0",
  paymentMethod: "PayPal" as PaymentMethod,
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

const PM_COLORS: Record<string, string> = {
  PayPal:  "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Venmo:   "text-sky-400 bg-sky-400/10 border-sky-400/20",
  Cash:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Zelle:   "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Card:    "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Crypto:  "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Other:   "text-text-muted bg-[#14141e] border-[#1c1c28]",
};

function ReceiptsContent() {
  const searchParams = useSearchParams();
  const {
    state: appState,
    loading: dataLoading,
    addReceipt,
  } = useAppData();
  const receipts = appState?.receipts ?? [];
  const settings = appState?.settings ?? getState().settings;
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [errors, setErrors]       = useState<Record<string,string>>({});
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [downloading, setDownloading] = useState<string|null>(null);
  const [newReceipt, setNewReceipt]   = useState<Receipt|null>(null);


  useEffect(() => {
    const itemName = searchParams.get("item");
    const price    = searchParams.get("price");
    if (itemName) {
      setForm(f => ({ ...f, itemName, salePrice: price || "" }));
      setModalOpen(true);
    }
  }, [searchParams]);

  const filtered = receipts.filter(r =>
    !search ||
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.itemName.toLowerCase().includes(search.toLowerCase()) ||
    r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = receipts.reduce((s,r)=>s+r.total, 0);
  const avgSale = receipts.length > 0 ? totalRevenue / receipts.length : 0;

  function validate() {
    const e: Record<string,string> = {};
    if (!form.customerName.trim()) e.customerName = "Customer name required";
    if (!form.itemName.trim())     e.itemName = "Item name required";
    if (!form.salePrice || isNaN(Number(form.salePrice)) || Number(form.salePrice) <= 0)
      e.salePrice = "Enter a valid sale price";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const salePrice    = parseFloat(form.salePrice)    || 0;
    const shippingCost = parseFloat(form.shippingCost) || 0;
    const tax          = parseFloat(form.tax)          || 0;
    const total        = salePrice + shippingCost + tax;
    const receipt = addReceipt({
      customerName:  form.customerName,
      customerEmail: form.customerEmail || undefined,
      itemName:      form.itemName,
      salePrice, shippingCost, tax, total,
      paymentMethod: form.paymentMethod,
      date:          form.date,
      sellerName:    settings.name,
      sellerEmail:   settings.email   || undefined,
      sellerPhone:   settings.phone   || undefined,
      notes:         form.notes       || undefined,
      verified: true,
    });
    setModalOpen(false);
    setSaving(false);
    setForm({ ...EMPTY_FORM });
    setNewReceipt(receipt);
    toast.success(`Receipt ${receipt.receiptNumber} created!`);
    try { await generateReceiptPDF(receipt); }
    catch { toast.error("PDF generation failed — try again"); }
  }

  async function handleDownload(receipt: Receipt) {
    setDownloading(receipt.id);
    try { await generateReceiptPDF(receipt); toast.success("PDF downloaded"); }
    catch { toast.error("PDF generation failed"); }
    setDownloading(null);
  }

  const openNew = () => { setForm({ ...EMPTY_FORM }); setErrors({}); setModalOpen(true); };
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const total = (parseFloat(form.salePrice)||0) + (parseFloat(form.shippingCost)||0) + (parseFloat(form.tax)||0);

  return (
    <AppLayout>
      <PageHeader
        title="Receipts"
        description={`${receipts.length} receipts · ${formatCurrency(totalRevenue)} total`}
        action={
          <>
            <Link href="/receipts/verify">
              <Button variant="secondary" size="sm"><ExternalLink size={13} /> Verify</Button>
            </Link>
            <Button size="sm" onClick={openNew}><Plus size={13} /> New Receipt</Button>
          </>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Receipts", value: receipts.length },
          { label: "Total Revenue",  value: formatCurrency(totalRevenue) },
          { label: "Average Sale",   value: formatCurrency(avgSale) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0f0f17] border border-[#1c1c28] rounded-xl p-4">
            <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-widest mb-1.5">{label}</div>
            <div className="text-lg font-display font-black text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, item, receipt number, payment method…"
            className="w-full bg-[#14141e] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/10 transition-all pl-10 pr-8 py-2.5"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={search ? "No receipts match" : "No receipts yet"}
            description={search ? "Try a different search term." : "Generate your first receipt after making a sale."}
            action={!search && <Button onClick={openNew}><Plus size={14} /> New Receipt</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1c1c28] bg-[#14141e]/60">
                  {["Receipt #","Date","Customer","Item","Payment","Sale","Total",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-display font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-[#1c1c28]/60 last:border-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[12px] font-bold text-accent-red">{r.receiptNumber}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-muted whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-[13px] font-semibold text-text-primary">{r.customerName}</div>
                      {r.customerEmail && <div className="text-[10px] text-text-muted">{r.customerEmail}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-secondary max-w-[160px] truncate">{r.itemName}</td>
                    <td className="px-4 py-3.5">
                      <Badge className={PM_COLORS[r.paymentMethod] || PM_COLORS.Other}>{r.paymentMethod}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-text-secondary">{formatCurrency(r.salePrice)}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-bold font-mono text-emerald-400">{formatCurrency(r.total)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloading === r.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1c1c28] text-text-muted hover:text-text-primary transition-all"
                        >
                          {downloading === r.id
                            ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            : <Download size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t border-[#1c1c28] bg-[#14141e]/40">
                    <td colSpan={6} className="px-4 py-3 text-[11px] font-display font-bold text-text-muted uppercase tracking-wider">
                      {filtered.length} receipts
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-black text-emerald-400">
                        {formatCurrency(filtered.reduce((s,r)=>s+r.total,0))}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>

      {/* ── New Receipt Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Receipt" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer Name" value={form.customerName} onChange={e => f("customerName", e.target.value)}
              placeholder="Full name" error={errors.customerName} />
            <Input label="Customer Email" type="email" value={form.customerEmail}
              onChange={e => f("customerEmail", e.target.value)} placeholder="optional" />
          </div>
          <Input label="Item Sold" value={form.itemName} onChange={e => f("itemName", e.target.value)}
            placeholder="e.g. Nike Air Jordan 4 Retro" error={errors.itemName} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Sale Price" prefix="$" type="number" step="0.01" min="0"
              value={form.salePrice} onChange={e => f("salePrice", e.target.value)} error={errors.salePrice} />
            <Input label="Shipping" prefix="$" type="number" step="0.01" min="0"
              value={form.shippingCost} onChange={e => f("shippingCost", e.target.value)} />
            <Input label="Tax" prefix="$" type="number" step="0.01" min="0"
              value={form.tax} onChange={e => f("tax", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Payment Method" value={form.paymentMethod}
              onChange={e => f("paymentMethod", e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </Select>
            <Input label="Date of Sale" type="date" value={form.date} onChange={e => f("date", e.target.value)} />
          </div>
          <Input label="Notes (optional)" value={form.notes} onChange={e => f("notes", e.target.value)}
            placeholder="Any notes to include on the receipt…" />

          {/* Total preview */}
          <div className="p-4 rounded-xl bg-[#14141e] border border-[#1c1c28] flex justify-between items-center">
            <div>
              <div className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider mb-0.5">Customer Pays</div>
              <div className="text-2xl font-display font-black text-emerald-400">{formatCurrency(total)}</div>
            </div>
            <div className="text-right text-xs text-text-muted space-y-0.5">
              <div>Sale: {formatCurrency(parseFloat(form.salePrice)||0)}</div>
              {parseFloat(form.shippingCost) > 0 && <div>+ Ship: {formatCurrency(parseFloat(form.shippingCost))}</div>}
              {parseFloat(form.tax) > 0 && <div>+ Tax: {formatCurrency(parseFloat(form.tax))}</div>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#1c1c28]">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}><FileText size={14} /> Generate & Download PDF</Button>
        </div>
      </Modal>

      {/* ── Success confirmation modal ── */}
      <Modal open={!!newReceipt} onClose={() => setNewReceipt(null)} title="Receipt Created" maxWidth="max-w-sm">
        {newReceipt && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <div className="font-mono text-accent-red font-bold text-sm mb-1">{newReceipt.receiptNumber}</div>
            <div className="font-display font-black text-2xl text-text-primary mb-1">{formatCurrency(newReceipt.total)}</div>
            <div className="text-text-secondary text-sm mb-5">Receipt for {newReceipt.customerName}</div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { handleDownload(newReceipt); setNewReceipt(null); }}>
                <Download size={14} /> Re-download PDF
              </Button>
              <Button className="flex-1" onClick={() => setNewReceipt(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08080d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReceiptsContent />
    </Suspense>
  );
}
