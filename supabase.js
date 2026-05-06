import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://gzoodfxfpztfmbybxina.supabase.co";
const supabaseAnonKey = "YOUR_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // 🔥 stops infinite loop crash
    detectSessionInUrl: true,
  },
});
