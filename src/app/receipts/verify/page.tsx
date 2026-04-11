"use client";
import { useState } from "react";
import { Search, CheckCircle, XCircle, ShieldCheck, ArrowLeft, ExternalLink, Clock } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { Receipt } from "@/types";

// Search all local stores (demo + all user stores) for a receipt by ID or number
function findReceiptAnywhere(id: string): Receipt | undefined {
  if (typeof window === "undefined") return undefined;
  const prefix = "reseller_os_";
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "");
      if (Array.isArray(parsed?.receipts)) {
        const found = parsed.receipts.find(
          (r: Receipt) => r.id === id || r.receiptNumber === id
        );
        if (found) return found;
      }
    } catch {}
  }
  return undefined;
}
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";

export default function VerifyPage() {
  const [query, setQuery]       = useState("");
  const [receipt, setReceipt]   = useState<Receipt | null | undefined>(undefined);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    await new Promise(r => setTimeout(r, 700));
    setReceipt(findReceiptAnywhere(query.trim()) ?? null);
    setSearching(false);
  }

  return (
    <div className="min-h-screen bg-[#08080d] grid-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-[#1c1c28] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-accent-red flex items-center justify-center">
            <ShieldCheck size={14} className="text-white" />
          </div>
          <span className="font-display font-black text-text-primary text-sm">ResellerOS Verify</span>
        </div>
        <Link href="/receipts" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
          <ArrowLeft size={12} /> Back to Receipts
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#14141e] border border-[#1c1c28] flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={30} className="text-blue-400" />
            </div>
            <h1 className="font-display font-black text-3xl text-text-primary tracking-tight mb-2">Verify Receipt</h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Enter a receipt ID or number to verify authenticity and view transaction details.
            </p>
          </div>

          {/* Search box */}
          <div className="bg-[#0f0f17] border border-[#1c1c28] rounded-2xl p-5 mb-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="ROS-2024-0001 or receipt ID…"
                  className="w-full bg-[#14141e] border border-[#1c1c28] hover:border-[#2a2a3a] rounded-xl text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all pl-10 pr-3.5 py-3"
                />
              </div>
              <Button onClick={handleSearch} loading={searching} className="shrink-0 h-11 px-5 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                <Search size={15} /> Verify
              </Button>
            </div>
            <p className="text-[11px] text-text-muted mt-3 text-center">
              Try: <button onClick={() => setQuery("ROS-2024-0001")} className="text-blue-400 hover:underline font-mono">ROS-2024-0001</button>
            </p>
          </div>

          {/* Not found */}
          {receipt === null && (
            <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 text-center">
              <XCircle size={36} className="text-red-400 mx-auto mb-3" />
              <h2 className="font-display font-bold text-text-primary text-lg mb-1">Receipt Not Found</h2>
              <p className="text-text-secondary text-sm">
                No receipt found for <span className="font-mono text-red-400">"{query}"</span>
              </p>
              <p className="text-text-muted text-xs mt-2">Double-check the receipt number and try again.</p>
            </div>
          )}

          {/* Found */}
          {receipt && (
            <div className="bg-emerald-950/20 border border-emerald-800/25 rounded-2xl overflow-hidden">
              {/* Verified header */}
              <div className="px-5 py-4 border-b border-emerald-800/20 flex items-center gap-3">
                <CheckCircle size={22} className="text-emerald-400 shrink-0" />
                <div>
                  <h2 className="font-display font-bold text-text-primary">Receipt Verified ✓</h2>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Authentic receipt from {receipt.sellerName}</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-3">
                {[
                  { label: "Receipt Number", value: receipt.receiptNumber, mono: true, highlight: true },
                  { label: "Date",           value: formatDate(receipt.date) },
                  { label: "Item",           value: receipt.itemName },
                  { label: "Sold To",        value: receipt.customerName },
                  { label: "Payment Method", value: receipt.paymentMethod },
                  { label: "Seller",         value: receipt.sellerName },
                ].map(({ label, value, mono, highlight }) => (
                  <div key={label} className="flex justify-between items-start gap-4 py-1.5 border-b border-emerald-900/20 last:border-0">
                    <span className="text-[10px] font-display font-bold text-text-muted uppercase tracking-wider shrink-0">{label}</span>
                    <span className={cn("text-sm text-right break-all", mono ? "font-mono" : "font-semibold", highlight ? "text-accent-red" : "text-text-primary")}>
                      {value}
                    </span>
                  </div>
                ))}

                {/* Total */}
                <div className="pt-3 mt-1 border-t border-emerald-800/20 flex justify-between items-center">
                  <span className="text-[10px] font-display font-black text-text-muted uppercase tracking-wider">Total Paid</span>
                  <span className="font-display font-black text-2xl text-emerald-400">{formatCurrency(receipt.total)}</span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="px-5 py-3 bg-emerald-950/20 border-t border-emerald-900/20 flex items-center gap-2 text-[10px] text-emerald-600">
                <Clock size={10} />
                Issued {formatDate(receipt.createdAt)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
