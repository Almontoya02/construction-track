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
  // The publishable/anon key "works" for reads (RLS just returns nothing) and
  // fails on every write, which is confusing. Catch it up front.
  if (key.startsWith("sb_publishable_") || isAnonJwt(key)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tiene la llave pública (publishable/anon). Usa la llave secreta: Supabase → Project Settings → API Keys → Secret keys (sb_secret_…) o la service_role.",
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/** Legacy keys are JWTs whose payload carries `"role": "anon"`. */
function isAnonJwt(key: string) {
  if (!key.startsWith("eyJ")) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
    );
    return payload.role === "anon";
  } catch {
    return false;
  }
}
