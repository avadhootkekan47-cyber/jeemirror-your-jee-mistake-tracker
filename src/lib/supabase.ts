import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://jeemirror-your-jee-mistake-tracker.vercel.app/api/supabase',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dGJ6c2N1dWZ3bGR3bWlvYmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU1OTksImV4cCI6MjA4NzI3MTU5OX0.jvy-oMaAf5Bl7M99IxsXE1npDdehL__xnmvl433tuwc',
  { auth: { storageKey: 'jeemirror-auth', persistSession: true, autoRefreshToken: true } }
);
