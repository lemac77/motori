import { supabase } from './supabaseClient';
import { cliente } from '@cliente/cliente.config';

export type TipoRichiesta = 'contatto' | 'permuta' | 'test_drive';

interface InvioRichiesta {
  tipo: TipoRichiesta;
  nome: string;
  email?: string;
  telefono: string;
  dati?: Record<string, unknown>;
}

/**
 * Salva la richiesta su Supabase (sempre, è il salvataggio che conta) e prova
 * a mandare la notifica email via Resend tramite la Edge Function
 * "invia-richiesta" (best-effort: se l'email fallisce, es. dominio Resend non
 * ancora verificato, la richiesta resta comunque salvata e visibile su
 * Supabase, non si perde nulla).
 */
export async function inviaRichiesta({ tipo, nome, email, telefono, dati }: InvioRichiesta): Promise<void> {
  // Demo: il form funziona e mostra la conferma, ma non salva né invia nulla
  if (cliente.demo) {
    await new Promise((r) => setTimeout(r, 700));
    return;
  }
  const { error } = await supabase.from('richieste_sito').insert({
    tipo,
    nome,
    email: email || null,
    telefono,
    dati: dati || {},
  });
  if (error) throw error;

  try {
    await supabase.functions.invoke('invia-richiesta', {
      body: { tipo, nome, email, telefono, dati },
    });
  } catch (err) {
    console.error('Notifica email non inviata (la richiesta è comunque salvata su Supabase):', err);
  }
}
