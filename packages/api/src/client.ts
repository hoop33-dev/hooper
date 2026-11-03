import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function initClient(client: SupabaseClient): void {
  _client = client;
}

export function getClient(): SupabaseClient {
  if (!_client) {
    throw new Error(
      "@hooper/api: Supabase client not initialised. Call initClient() before using any service.",
    );
  }
  return _client;
}
