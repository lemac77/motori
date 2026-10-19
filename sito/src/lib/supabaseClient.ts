import { createClient } from '@supabase/supabase-js'

// Stesso progetto Supabase del pannello gestione annunci.
// Il sito legge in sola lettura solo gli annunci con stato_pubblicazione = 'pubblicato',
// grazie alla RLS policy già configurata per la chiave anon (vedi sql/schema.sql del pannello).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
