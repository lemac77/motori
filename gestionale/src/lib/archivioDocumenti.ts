import { jsPDF } from 'jspdf'
import { supabase } from './supabaseClient'

export type TipoDocumento = 'contratto_vendita' | 'contratto_acquisto' | 'certificato_conformita' | 'scheda_permuta'

export const LABEL_TIPO: Record<TipoDocumento, string> = {
  contratto_vendita: 'Contratto di Vendita',
  contratto_acquisto: 'Contratto di Acquisto',
  certificato_conformita: 'Certificato di Conformità',
  scheda_permuta: 'Scheda Permuta',
}

/**
 * Salva una copia del PDF già generato nell'Archivio Documenti (Supabase Storage
 * + tabella documenti_generati). Va chiamata DOPO scarica(), a cui non è legata:
 * se il salvataggio in archivio fallisce (bucket non ancora creato, rete, ecc.)
 * logga solo l'errore in console, il download locale che l'utente ha già ricevuto
 * non viene toccato. Chiamata "fire and forget", non va messa in await dal chiamante.
 */
export async function salvaInArchivio(
  doc: jsPDF,
  nomeFile: string,
  annuncioId: string | undefined | null,
  tipo: TipoDocumento,
  numeroContratto: string | null | undefined
): Promise<void> {
  if (!annuncioId) return

  try {
    const blob = doc.output('blob')
    const path = `${annuncioId}/${Date.now()}-${nomeFile}`

    const { error: uploadError } = await supabase.storage.from('documenti').upload(path, blob, {
      contentType: 'application/pdf',
    })
    if (uploadError) throw uploadError

    const { error: insertError } = await supabase.from('documenti_generati').insert({
      annuncio_id: annuncioId,
      tipo,
      tipo_label: LABEL_TIPO[tipo],
      numero_contratto: numeroContratto || null,
      nome_file: nomeFile,
      storage_path: path,
    })
    if (insertError) throw insertError
  } catch (err) {
    console.error('Archivio documenti: salvataggio fallito (il download locale è comunque avvenuto)', err)
  }
}

export interface DocumentoArchiviato {
  id: string
  annuncio_id: string
  tipo: TipoDocumento
  tipo_label: string
  numero_contratto: string | null
  nome_file: string
  storage_path: string
  creato_il: string
}

export const ORDINE_TIPI_DOCUMENTO: TipoDocumento[] = [
  'contratto_vendita',
  'contratto_acquisto',
  'certificato_conformita',
  'scheda_permuta',
]

export interface DocumentoArchiviatoConAuto extends DocumentoArchiviato {
  annunci: { marca: string; modello: string; versione: string | null } | null
}

/** Lista TUTTI i documenti archiviati (di tutti gli annunci), più recenti prima, con dati auto. */
export async function listaTuttiIDocumenti(): Promise<DocumentoArchiviatoConAuto[]> {
  const { data, error } = await supabase
    .from('documenti_generati')
    .select('*, annunci(marca, modello, versione)')
    .order('creato_il', { ascending: false })
  if (error) throw error
  return (data || []) as DocumentoArchiviatoConAuto[]
}

/** Lista i documenti archiviati per un annuncio, più recenti prima. */
export async function listaDocumentiArchiviati(annuncioId: string): Promise<DocumentoArchiviato[]> {
  const { data, error } = await supabase
    .from('documenti_generati')
    .select('*')
    .eq('annuncio_id', annuncioId)
    .order('creato_il', { ascending: false })
  if (error) throw error
  return (data || []) as DocumentoArchiviato[]
}

/** Genera un URL firmato temporaneo (10 minuti) per riscaricare un documento archiviato. */
export async function urlDownloadArchivio(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documenti').createSignedUrl(storagePath, 600)
  if (error) throw error
  return data.signedUrl
}

/** Elimina un documento dall'archivio (file su storage + riga in tabella). */
export async function eliminaDaArchivio(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from('documenti').remove([storagePath])
  const { error } = await supabase.from('documenti_generati').delete().eq('id', id)
  if (error) throw error
}
