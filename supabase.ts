import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ifexryhohzwyxkgdauyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_L7RjkQhv22zt8Fd3hmjyog_eXETfOBG";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
