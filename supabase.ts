import { createClient } from "@supabase/supabase-js";

// This is the public anon key only; it is safe for browser use when RLS is enabled.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://upkzlppvwckriuidnyvq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwa3pscHB2d2Nrcml1aWRueXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NjUyNTIsImV4cCI6MjEwMTM0MTI1Mn0.DhGB5MFdRyOeJw0qL297r4NAG5vbAbVpdz18H-d-LnY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
