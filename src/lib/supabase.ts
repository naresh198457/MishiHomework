import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// null when env vars are missing (e.g. local dev without .env.local): the app
// then runs in guest mode with no login and no saved history.
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
