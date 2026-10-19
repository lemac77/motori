import { supabase } from './supabaseClient'

/**
 * Genera un nuovo numero contratto automatico (es. "2026-014"), incrementando
 * il contatore condiviso lato database. Ogni chiamata restituisce un numero
 * diverso e mai ripetuto, anche se chiamata da due persone contemporaneamente.
 */
export async function generaNumeroContratto(): Promise<string> {
  const { data, error } = await supabase.rpc('genera_numero_contratto')
  if (error) throw error
  return data as string
}
