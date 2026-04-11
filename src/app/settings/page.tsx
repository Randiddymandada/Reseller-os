"use client";
import { useEffect, useState } from "react";
import { Save, User, Database, AlertTriangle, CheckCircle, LogOut, ExternalLink, Zap, Crown } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button, Card, Input, Modal } from "@/components/ui";
import { useAppData } from "@/lib/useAppData";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { SellerSettings } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user, plan, isDemo, signOut } = useAuth();

  const [settings, setSettings] = useState<SellerSettings>({
    name: "", email: "", phone: "", address: "", businessName: "",
  });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [signOutModal, setSignOutModal] = useState(false);
  const [storageInfo, setStorageInfo]   = useState({ items: 0, receipts: 0, size: "—" });

  const { state: appState, updateSettings: saveSettings, reset: doReset } = useAppData();

  useEffect(() => {
    if (!appState) return;
    // Pre-fill from profile if settings are empty and user is authenticated
    const currentSettings = appState.settings;
    const merged = {
      ...currentSettings,
      name: currentSettings.name || user?.user_metadata?.full_name || "",
      email: currentSettings.email || user?.email || "",
    };
    setSettings(merged);
    // Storage info
    const storageKey = user && !isDemo
      ? `reseller_os_user_${user.id}`
      : "reseller_os_demo_data";
    const raw = localStorage.getItem(storageKey) || "";
    setStorageInfo({
      items:    appState.inventory.length,
      receipts: appState.receipts.length,
      size:     `${(raw.length / 1024).toFixed(1)} KB`,
    });
  }, [appState, user, isDemo]);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 350));
    saveSettings(settings);
    setSaving(false); setSaved(true);
    toast.success("Settings saved");
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    router.push("/");
  }

  function handleReset() {
    doReset();
    toast.success(isDemo ? "Demo data cleared — reloading…" : "Your data has been cleared — reloading…");
    setResetModal(false);
    setTimeout(() => window.location.reload(), 900);
  }

  const f = (k: keyof SellerSettings, v: string) => setSettings(p => ({ ...p, [k]: v }));

  return (
    <AppLayout>
      <PageHeader title="Settings" description="Manage your profile, account, and data." />

      <div className="max-w-2xl space-y-4">

        {/* Account info (when authenticated) */}
        {!isDemo && user && (
          <Card>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1c1c28]">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <User size={16} className="text-blue-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-text-primary text-sm">Account</h2>
                <p className="text-[11px] text-text-muted">Your ResellerOS account details</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center py-2 border-b border-[#1c1c28]/60">
                <span className="text-xs text-text-muted font-display font-bold uppercase tracking-wider">Email</span>
                <span className="text-xs text-text-secondary font-mono">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1c1c28]/60">
                <span className="text-xs text-text-muted font-display font-bold uppercase tracking-wider">Plan</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold capitalize",
                    plan === "premium" ? "text-amber-400" : plan === "pro" ? "text-accent-red" : "text-text-secondary"
                  )}>{plan}</span>
                  {plan !== "premium" && (
                    <Link href="/billing" className="text-[10px] text-accent-red hover:underline font-semibold">Upgrade</Link>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-text-muted font-display font-bold uppercase tracking-wider">Member since</span>
                <span className="text-xs text-text-secondary">{user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/billing" className="flex-1">
                <Button variant="secondary" className="w-full" size="sm">
                  {plan === "premium" ? <Crown size={13} className="text-amber-400" /> : <Zap size={13} />}
                  {plan === "free" ? "Upgrade Plan" : "Manage Billing"}
                  <ExternalLink size={12} />
                </Button>
              </Link>
              <Button variant="danger" size="sm" onClick={() => setSignOutModal(true)}>
                <LogOut size={13} /> Sign Out
              </Button>
            </div>
          </Card>
        )}

        {/* Seller profile */}
        <Card>
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1c1c28]">
            <div className="w-9 h-9 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
              <User size={16} className="text-accent-red" />
            </div>
            <div>
              <h2 className="font-display font-bold text-text-primary text-sm">Seller Profile</h2>
              <p className="text-[11px] text-text-muted">Shown on generated receipts</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Your Name"      value={settings.name}         onChange={e => f("name", e.target.value)}         placeholder="Jordan Reeves" />
            <Input label="Business Name"  value={settings.businessName} onChange={e => f("businessName", e.target.value)} placeholder="My Resell Store" />
            <Input label="Email Address"  type="email" value={settings.email} onChange={e => f("email", e.target.value)} placeholder="you@example.com" />
            <Input label="Phone Number"   value={settings.phone}        onChange={e => f("phone", e.target.value)}         placeholder="(619) 555-0000" />
            <div className="sm:col-span-2">
              <Input label="Location / Address" value={settings.address} onChange={e => f("address", e.target.value)} placeholder="San Diego, CA" />
            </div>
          </div>

          <div className="flex justify-end mt-5 pt-4 border-t border-[#1c1c28]">
            <Button onClick={handleSave} loading={saving}
              className={cn(saved && "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20")}>
              {saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Settings</>}
            </Button>
          </div>
        </Card>

        {/* Data & storage */}
        <Card>
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1c1c28]">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-text-primary text-sm">Data & Storage</h2>
              <p className="text-[11px] text-text-muted">All data lives locally in your browser</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Inventory Items", value: storageInfo.items },
              { label: "Receipts",        value: storageInfo.receipts },
              { label: "Storage Used",    value: storageInfo.size },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#14141e] border border-[#1c1c28] rounded-xl p-3 text-center">
                <div className="text-base font-display font-black text-text-primary">{value}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {[
              ["Version",         "1.4.0 — SaaS Ready"],
              ["Storage Engine",  isDemo ? "Browser LocalStorage (Demo)" : "Supabase + LocalStorage"],
              ["Auth",            isDemo ? "Demo mode — no account" : "Supabase Auth"],
              ["Payments",        "Stripe (configure in .env.local)"],
              ["PDF Generation",  "Client-side via jsPDF"],
              ["Supabase Ready",  "Swap lib/store.ts for cloud data"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-[#1c1c28]/60 last:border-0">
                <span className="text-xs text-text-muted font-display font-bold uppercase tracking-wider">{label}</span>
                <span className="text-xs text-text-secondary font-mono">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-950/40">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-950/30">
            <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-red-400 text-sm">Danger Zone</h2>
              <p className="text-[11px] text-text-muted">Irreversible actions</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary font-semibold">Reset All Local Data</p>
              <p className="text-xs text-text-muted mt-0.5">{isDemo ? "Clears demo data from this browser. Demo data will reload on next visit." : "Permanently deletes your inventory, receipts, orders, and settings from this browser."}</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setResetModal(true)}>
              <AlertTriangle size={13} /> Reset
            </Button>
          </div>
        </Card>
      </div>

      {/* Sign out modal */}
      <Modal open={signOutModal} onClose={() => setSignOutModal(false)} title="Sign Out" maxWidth="max-w-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#14141e] border border-[#1c1c28] flex items-center justify-center shrink-0">
            <LogOut size={18} className="text-text-secondary" />
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">
            You'll be returned to the landing page. Your local data stays in this browser.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setSignOutModal(false)}>Cancel</Button>
          <Button onClick={handleSignOut}><LogOut size={13} /> Sign Out</Button>
        </div>
      </Modal>

      {/* Reset modal */}
      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Reset All Data" maxWidth="max-w-sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-text-primary font-semibold text-sm mb-1">This cannot be undone.</p>
            <p className="text-text-secondary text-sm leading-relaxed">
              All <strong className="text-text-primary">{storageInfo.items} inventory items</strong> and{" "}
              <strong className="text-text-primary">{storageInfo.receipts} receipts</strong> will be permanently deleted.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setResetModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReset}><AlertTriangle size={13} /> Delete Everything</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
