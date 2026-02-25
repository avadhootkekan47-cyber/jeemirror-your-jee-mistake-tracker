import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rutbzscuufwldwmiobcb.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dGJ6c2N1dWZ3bGR3bWlvYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1OTksImV4cCI6MjA4NzI3MTU5OX0.jvy-oMaAf5Bl7M99IxsXE1npDdehL__xnmvl433tuwc"
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
