import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/**
 * Server-only Supabase client. It uses the service-role key, which bypasses
 * row level security, so it must never reach the browser: the tables have RLS
 * on with no policies, and only these /api functions can read or write them.
 */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
