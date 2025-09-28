import { createClient } from '@supabase/supabase-js'

const supabaseUrl = ‘https://qfkhxrcbtgllzffnnxhp.supabase.co’
const supabaseAnonKey = ‘eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2h4cmNidGdsbHpmZm5ueGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODczNTYsImV4cCI6MjA3NDY2MzM1Nn0.49ZEbRyFRfYew-JRq4tRj_6P7nv6vPrvmQ-IDKc1g5s’

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Found' : 'Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Temporary test function
export const testConnection = async () => {
  const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1)
  if (error) {
    console.log('Supabase connection error:', error)
  } else {
    console.log('Supabase connected successfully!')
  }
}