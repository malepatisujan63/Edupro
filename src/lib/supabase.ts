// src/lib/supabase.ts
// ─── Supabase PostgreSQL Client Initialization ───
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lfxmjnfnopqpghylljmj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeG1qbmZub3BxcGdoeWxsam1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODE1OTMsImV4cCI6MjA5OTg1NzU5M30.O4x4oH85Mn1XtV4up-iKiiJlaQHKlfR22ETJ5IHgu9s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
