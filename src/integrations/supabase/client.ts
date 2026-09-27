import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase publishable connection details are safe to include in browser code.
// Environment variables still take precedence, while these fallbacks prevent a
// blank production page when a hosting integration uses non-Vite variable names.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://sywuciyhimfvqwzevcdy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_IFgCDvCBjQmI_Og2-Yvmhw_pljYkS-d';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
