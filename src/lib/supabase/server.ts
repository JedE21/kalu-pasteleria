import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasPublicSupabaseEnv, hasServiceSupabaseEnv } from "@/lib/env";

type ClientMode = "anon" | "service";

export function createSupabaseServerClient(mode: ClientMode = "anon"): SupabaseClient | null {
  const useService = mode === "service" && hasServiceSupabaseEnv;
  const key = useService ? env.supabaseServiceRoleKey : env.supabaseAnonKey;

  if (!env.supabaseUrl || !key || (!hasPublicSupabaseEnv && !useService)) {
    return null;
  }

  return createClient(env.supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
