import { supabase } from './supabaseClient'

export interface ImpostazioniGenerali {
  tasso_finanziamento_tan: number
  taeg_con_assicurazione: number
  taeg_senza_assicurazione: number
  spese_istruttoria: number
  spese_incasso_rata: number
  rapporto_assicurazione: number
  prossimo_numero_progressivo: number
}

const DEFAULT: ImpostazioniGenerali = {
  tasso_finanziamento_tan: 10.45,
  taeg_con_assicurazione: 15.95,
  taeg_senza_assicurazione: 16,
  spese_istruttoria: 400,
  spese_incasso_rata: 0,
  rapporto_assicurazione: 0.2227,
  prossimo_numero_progressivo: 1,
}

export async function leggiImpostazioni(): Promise<ImpostazioniGenerali> {
  const { data } = await supabase.from('impostazioni_generali').select('*').eq('id', 1).single()
  return {
    tasso_finanziamento_tan: data?.tasso_finanziamento_tan ?? DEFAULT.tasso_finanziamento_tan,
    taeg_con_assicurazione: data?.taeg_con_assicurazione ?? DEFAULT.taeg_con_assicurazione,
    taeg_senza_assicurazione: data?.taeg_senza_assicurazione ?? DEFAULT.taeg_senza_assicurazione,
    spese_istruttoria: data?.spese_istruttoria ?? DEFAULT.spese_istruttoria,
    spese_incasso_rata: data?.spese_incasso_rata ?? DEFAULT.spese_incasso_rata,
    rapporto_assicurazione: data?.rapporto_assicurazione ?? DEFAULT.rapporto_assicurazione,
    prossimo_numero_progressivo: data?.prossimo_numero_progressivo ?? DEFAULT.prossimo_numero_progressivo,
  }
}

export async function salvaImpostazioni(valori: ImpostazioniGenerali) {
  return supabase.from('impostazioni_generali').update(valori).eq('id', 1)
}