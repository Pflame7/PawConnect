import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Guard: uploads will break if env vars are missing.
if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error(
    "[Supabase] Missing env vars. Check .env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url, anon);
