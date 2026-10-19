// Supabase Edge Function: invia-richiesta
// Riceve i dati di una richiesta dal sito (contatto/permuta/test drive) e
// manda una email di notifica via Resend. Va deployata con:
//   supabase functions deploy invia-richiesta
// e configurata con questi secrets (Supabase Dashboard > Edge Functions > Secrets,
// oppure via CLI: supabase secrets set NOME=valore):
//   RESEND_API_KEY               -> la tua chiave API Resend
//   EMAIL_DESTINATARIO_RICHIESTE -> dove arrivano le notifiche (es. info@salone.it)
//   EMAIL_MITTENTE                -> mittente, DEVE essere su un dominio verificato
//                                    su Resend (es. "Nome Salone <notifiche@salone.it>").
//   NOME_SITO                     -> nome mostrato nel footer della mail (es. "salone.it")
//   COLORE_BRAND                  -> colore della testata mail (es. "#e8612c")
//                                    Finché il dominio non è verificato su Resend,
//                                    questa chiamata fallirà: va bene, la richiesta
//                                    resta comunque salvata su Supabase (vedi
//                                    src/lib/richieste.ts, è un invio "best effort").

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Nessun default "vero": se mancano i secrets la funzione si ferma con un errore chiaro
const EMAIL_DESTINATARIO = Deno.env.get('EMAIL_DESTINATARIO_RICHIESTE');
const EMAIL_MITTENTE = Deno.env.get('EMAIL_MITTENTE') || 'Sito web <onboarding@resend.dev>';
const NOME_SITO = Deno.env.get('NOME_SITO') || 'sito web';
const COLORE_BRAND = Deno.env.get('COLORE_BRAND') || '#333333';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LABEL_TIPO: Record<string, string> = {
  contatto: 'Richiesta di contatto',
  permuta: 'Richiesta valutazione permuta',
  test_drive: 'Richiesta test drive',
};

// Etichette leggibili per i campi extra (dati.*), altrimenti in mail uscirebbero
// i nomi grezzi delle variabili tipo "marcaModello" o "dataImmatricolazione".
const LABEL_CAMPO: Record<string, string> = {
  provincia: 'Provincia',
  auto_interesse: 'Auto di interesse',
  messaggio: 'Messaggio',
  marcaModello: 'Marca e modello',
  dataImmatricolazione: 'Data immatricolazione',
  km: 'Chilometraggio',
  cilindrata: 'Cilindrata',
  alimentazione: 'Alimentazione',
  targa: 'Targa',
  colore: 'Colore',
  valoreRichiesto: 'Valore richiesto',
  note: 'Note',
  auto: 'Auto',
  dataDesiderata: 'Data desiderata',
  fasciaOraria: 'Fascia oraria',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY non configurata nei secrets della Edge Function');
    }
    if (!EMAIL_DESTINATARIO) {
      throw new Error('EMAIL_DESTINATARIO_RICHIESTE non configurata nei secrets della Edge Function');
    }

    const { tipo, nome, email, telefono, dati } = await req.json();

    const righeDati = Object.entries(dati || {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 10px;color:#666;font-size:13px">${LABEL_CAMPO[k] || k}</td><td style="padding:4px 10px;font-size:13px"><b>${v}</b></td></tr>`
      )
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:${COLORE_BRAND};padding:16px 20px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">${LABEL_TIPO[tipo] || tipo}</h2>
        </div>
        <div style="border:1px solid #eee;border-top:none;padding:20px;border-radius:0 0 8px 8px">
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:4px 10px;color:#666;font-size:13px">Nome</td><td style="padding:4px 10px;font-size:13px"><b>${nome || '-'}</b></td></tr>
            <tr><td style="padding:4px 10px;color:#666;font-size:13px">Email</td><td style="padding:4px 10px;font-size:13px"><b>${email || '-'}</b></td></tr>
            <tr><td style="padding:4px 10px;color:#666;font-size:13px">Telefono</td><td style="padding:4px 10px;font-size:13px"><b>${telefono || '-'}</b></td></tr>
            ${righeDati}
          </table>
          <p style="color:#999;font-size:11px;margin-top:20px">Ricevuta automaticamente da ${NOME_SITO}</p>
        </div>
      </div>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_MITTENTE,
        to: EMAIL_DESTINATARIO,
        reply_to: email || undefined,
        subject: `${LABEL_TIPO[tipo] || 'Nuova richiesta'} — ${nome || 'Sito web'}`,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Resend ha risposto con errore: ${errText}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
