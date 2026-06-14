export const env = {
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseDbUrl: process.env.SUPABASE_DB_URL ?? ""
};

export const hasPublicSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasServiceSupabaseEnv = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
