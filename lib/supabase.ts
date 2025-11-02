/// <reference types="../vite-env.d.ts" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Found' : 'Missing');

// Create client with fallback URLs if environment variables are missing
export const supabase = createClient(
  supabaseUrl || 'https://qfkhxrcbtgllzffnnxhp.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2h4cmNidGdsbHpmZm5ueGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODczNTYsImV4cCI6MjA3NDY2MzM1Nn0.49ZEbRyFRfYew-JRq4tRj_6P7nv6vPrvmQ-IDKc1g5s'
)
