import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://gzoodfxfpztfmbybxina.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6b29kZnhmcHp0Zm1ieWJ4aW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzU0MTcsImV4cCI6MjA5MjcxMTQxN30.K_5Flc8AnnnmYsitUgks11nl05ibqgH6rwqEfIL64_w"
);