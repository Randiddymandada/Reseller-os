"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  plan: "free" | "pro" | "premium";
  isDemo: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: false,
  plan: "free", isDemo: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [plan, setPlan]       = useState<"free"|"pro"|"premium">("free");

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchPlan(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchPlan(session.user.id);
      else setPlan("free");
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchPlan(userId: string) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_plans")
        .select("plan")
        .eq("user_id", userId)
        .single();
      if (data?.plan) setPlan(data.plan as "free"|"pro"|"premium");
    } catch { setPlan("free"); }
  }

  async function signOut() {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null); setSession(null); setPlan("free");
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, plan, isDemo: !isSupabaseConfigured, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

export function usePlanLimits() {
  const { plan } = useAuth();
  return {
    maxInventory:      plan === "free" ? 10 : Infinity,
    canUseOrders:      plan !== "free",
    canUsePricing:     plan === "premium",
    canUseRestock:     plan === "premium",
    canExportCSV:      plan !== "free",
    unlimitedReceipts: plan !== "free",
    plan,
  };
}
