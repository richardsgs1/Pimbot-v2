import { createClient } from '@supabase/supabase-js'

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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