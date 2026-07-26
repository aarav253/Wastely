import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/** null when Supabase isn't configured yet -- callers must treat accounts/login as unavailable, not error. */
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
