import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  SUPABASE_KEY.length > 0 && SUPABASE_KEY !== "YOUR_SUPABASE_ANON_KEY";

export function createClient() {
  if (!isSupabaseConfigured) return null as any;
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}
