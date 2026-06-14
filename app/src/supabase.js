import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Supabase is not configured. Copy app/.env.example to app/.env, paste your project URL and anon key from Supabase → Settings → API, then restart npm run dev.'

if (!isSupabaseConfigured) {
  console.error('[Adapark]', supabaseConfigError)
}

export const supabaseProjectRef =
  supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'unknown'

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
)