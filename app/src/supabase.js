import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://avoppyzsftbbvwfbszat.supabase.co'
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2b3BweXpzZnRiYnZ3ZmJzemF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzMzNjEsImV4cCI6MjA5Njc0OTM2MX0.jY1a2KyFviTogOsWT7V3ao7ekuDtZlviBuen9n4_xCQ'

export const supabase = createClient(supabaseUrl, supabaseKey)