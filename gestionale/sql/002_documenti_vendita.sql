-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: campi Documenti di Vendita
-- Da eseguire su Supabase (SQL Editor) prima di usare la pagina
-- "Documenti di Vendita" nel pannello.
-- =====================================================

alter table annunci
  -- Registrazione veicolo
  add column if not exists targa text,
  add column if not exists numero_telaio text,
  add column if not exists provenienza text,
  add column if not exists numero_proprietari int,
  add column if not exists numero_mini_pass int,
  add column if not exists ultima_manutenzione_km int,
  add column if not exists ultima_manutenzione_data date,
  add column if not exists scadenza_revisione date,
  add column if not exists scadenza_bollo date,
  add column if not exists km_alla_consegna int,

  -- Dotazioni e checklist (salvate come JSON per flessibilità)
  add column if not exists dotazioni jsonb,
  add column if not exists esame_tecnico jsonb,
  add column if not exists certificato_conformita jsonb,
  add column if not exists prova_strada_acquirente boolean,

  -- Dati acquirente
  add column if not exists cliente_nome text,
  add column if not exists cliente_cognome text,
  add column if not exists cliente_data_nascita date,
  add column if not exists cliente_luogo_nascita text,
  add column if not exists cliente_indirizzo text,
  add column if not exists cliente_cap text,
  add column if not exists cliente_citta text,
  add column if not exists cliente_provincia text,
  add column if not exists cliente_cellulare text,
  add column if not exists cliente_telefono text,
  add column if not exists cliente_email text,
  add column if not exists cliente_codice_fiscale text,
  add column if not exists cliente_piva text,
  add column if not exists cliente_professione text,

  -- Veicolo in permuta
  add column if not exists permuta_marca text,
  add column if not exists permuta_modello text,
  add column if not exists permuta_versione text,
  add column if not exists permuta_targa text,
  add column if not exists permuta_anno int,
  add column if not exists permuta_km int,
  add column if not exists permuta_valore numeric(10,2),
  add column if not exists permuta_passaggio_proprieta_costo numeric(10,2),

  -- Condizioni economiche di vendita
  add column if not exists prezzo_finale_vendita numeric(10,2),
  add column if not exists garanzia_aggiuntiva_mesi int,
  add column if not exists caparra_penitenziale numeric(10,2),
  add column if not exists saldo_da_versare numeric(10,2),
  add column if not exists richiesta_finanziamento text,
  add column if not exists finanziamento_importo numeric(10,2),
  add column if not exists finanziamento_rate int,
  add column if not exists data_consegna_prevista date;
