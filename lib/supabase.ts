/// <reference types="../vite-env.d.ts" />
import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Raw Supabase URL:', supabaseUrl);
console.log('Raw Supabase Key:', supabaseAnonKey);

// Ensure we have valid values
if (!supabaseUrl || supabaseUrl.trim() === '') {
  supabaseUrl = 'https://qfkhxrcbtgllzffnnxhp.supabase.co'
}

if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2h4cmNidGdsbHpmZm5ueGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODczNTYsImV4cCI6MjA3NDY2MzM1Nn0.49ZEbRyFRfYew-JRq4tRj_6P7nv6vPrvmQ-IDKc1g5s'
}

console.log('Final Supabase URL:', supabaseUrl);
console.log('Final Supabase Key:', supabaseAnonKey ? 'Found' : 'Missing');

// Create client with validated URLs
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
