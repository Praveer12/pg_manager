import { createClient } from '@supabase/supabase-js';

// Use Vite environment variables so keys aren't committed to git
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// We only initialize if the config is partially valid to avoid crashing 
// if the user hasn't configured it yet.
let supabase = null;

try {
  if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error("Supabase initialization error", error);
}

export { supabase };
