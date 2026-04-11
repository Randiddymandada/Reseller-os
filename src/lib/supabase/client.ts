import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  SUPABASE_KEY.length > 0 && SUPABASE_KEY !== "YOUR_SUPABASE_ANON_KEY";

export function createClient() {
  if (!isSupabaseConfigured) {
    // Return a mock client that never throws
    return null as any;
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
