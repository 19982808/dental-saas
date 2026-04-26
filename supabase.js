import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://gzoodfxfpztfmbybxina.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6b29kZnhmcHp0Zm1ieWJ4aW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzU0MTcsImV4cCI6MjA5MjcxMTQxN30.K_5Flc8AnnnmYsitUgks11nl05ibqgH6rwqEfIL64_w";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
