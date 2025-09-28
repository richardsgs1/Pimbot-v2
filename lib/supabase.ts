import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qfkhxrcbtgllzffnnxhp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFma2h4cmNidGdsbHpmZm5ueGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODczNTYsImV4cCI6MjA3NDY2MzM1Nn0.49ZEbRyFRfYew-JRq4tRj_6P7nv6vPrvmQ-IDKc1g5s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
