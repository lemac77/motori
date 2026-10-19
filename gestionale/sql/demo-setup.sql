-- =====================================================================
-- SETUP COMPLETO DATABASE (demo Berica Motori)
-- Incolla TUTTO questo file in Supabase > SQL Editor > New query > Run.
-- Crea: tabelle, permessi, bucket foto/documenti, numerazione contratti,
-- auto di esempio e reset automatico ogni notte alle 03:00.
-- Va eseguito UNA volta su un progetto Supabase vuoto.
-- =====================================================================
-- =====================================================
-- GESTIONALE AUTOSALONE - Schema Supabase
-- Annunci auto + gestione foto con RLS
-- =====================================================

-- Estensione per generare UUID
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABELLA: annunci
-- =====================================================
create table if not exists annunci (
  id uuid primary key default uuid_generate_v4(),

  -- Dati principali
  marca text not null,
  modello text not null,
  versione text,
  prezzo numeric(10,2) not null,

  -- Condizione e immatricolazione
  condizione text not null default 'Usato' check (condizione in ('Usato', 'Nuovo', 'Km0')),
  immatricolazione_mese int check (immatricolazione_mese between 1 and 12),
  immatricolazione_anno int,

  -- Dati tecnici
  km int not null default 0,
  alimentazione text not null check (alimentazione in ('Benzina', 'Diesel', 'GPL', 'Metano', 'Elettrica', 'Ibrida')),
  cambio text not null check (cambio in ('Manuale', 'Automatico')),
  colore text,
  carrozzeria text,
  porte text,
  posti int,
  classe_emissioni text,
  cv int,

  -- Descrizione
  descrizione text,

  -- Stato pubblicazione
  stato_pubblicazione text not null default 'bozza' check (stato_pubblicazione in ('bozza', 'pubblicato', 'venduto')),

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indice per query frequenti (lista pubblica, filtri)
create index if not exists idx_annunci_stato on annunci(stato_pubblicazione);
create index if not exists idx_annunci_marca on annunci(marca);
create index if not exists idx_annunci_created on annunci(created_at desc);

-- =====================================================
-- TABELLA: annuncio_foto
-- =====================================================
create table if not exists annuncio_foto (
  id uuid primary key default uuid_generate_v4(),
  annuncio_id uuid not null references annunci(id) on delete cascade,

  -- URL versione originale (per zoom/dettaglio) e thumbnail (per liste/gallery)
  url_originale text not null,
  url_thumbnail text not null,

  ordine int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_foto_annuncio on annuncio_foto(annuncio_id, ordine);

-- =====================================================
-- TRIGGER: aggiorna updated_at automaticamente
-- =====================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_annunci_updated_at on annunci;
create trigger trg_annunci_updated_at
  before update on annunci
  for each row execute function set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table annunci enable row level security;
alter table annuncio_foto enable row level security;

-- Lettura pubblica SOLO annunci pubblicati (per il sito vetrina, anon key)
create policy "Pubblico legge solo annunci pubblicati"
  on annunci for select
  to anon
  using (stato_pubblicazione = 'pubblicato');

create policy "Pubblico legge foto di annunci pubblicati"
  on annuncio_foto for select
  to anon
  using (
    exists (
      select 1 from annunci
      where annunci.id = annuncio_foto.annuncio_id
      and annunci.stato_pubblicazione = 'pubblicato'
    )
  );

-- Utenti autenticati (pannello admin) vedono e gestiscono tutto
create policy "Autenticati leggono tutti gli annunci"
  on annunci for select
  to authenticated
  using (true);

create policy "Autenticati creano annunci"
  on annunci for insert
  to authenticated
  with check (true);

create policy "Autenticati modificano annunci"
  on annunci for update
  to authenticated
  using (true)
  with check (true);

create policy "Autenticati eliminano annunci"
  on annunci for delete
  to authenticated
  using (true);

create policy "Autenticati leggono tutte le foto"
  on annuncio_foto for select
  to authenticated
  using (true);

create policy "Autenticati caricano foto"
  on annuncio_foto for insert
  to authenticated
  with check (true);

create policy "Autenticati modificano foto"
  on annuncio_foto for update
  to authenticated
  using (true)
  with check (true);

create policy "Autenticati eliminano foto"
  on annuncio_foto for delete
  to authenticated
  using (true);

-- =====================================================
-- STORAGE BUCKET (da creare anche da dashboard Supabase)
-- Nome bucket: annunci-foto
-- Pubblico: si (per servire le immagini al sito vetrina)
-- =====================================================
insert into storage.buckets (id, name, public)
values ('annunci-foto', 'annunci-foto', true)
on conflict (id) do nothing;

-- Policy storage: chiunque legge, solo autenticati caricano/eliminano
create policy "Pubblico legge foto storage"
  on storage.objects for select
  to public
  using (bucket_id = 'annunci-foto');

create policy "Autenticati caricano foto storage"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'annunci-foto');

create policy "Autenticati eliminano foto storage"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'annunci-foto');

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

-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: accessori annuncio
-- Da eseguire su Supabase (SQL Editor) prima di usare la nuova
-- sezione "Accessori" nel form annuncio.
-- =====================================================

alter table annunci
  add column if not exists accessori jsonb;

-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: numero contratto
-- Da eseguire su Supabase (SQL Editor) prima di usare il campo
-- "Numero contratto" nella pagina Documenti di Vendita.
-- =====================================================

alter table annunci
  add column if not exists numero_contratto text;

-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: impostazioni generali (finanziamento)
-- Da eseguire su Supabase (SQL Editor) prima di usare la pagina
-- "Impostazioni" e il simulatore rata nei Documenti di Vendita.
-- =====================================================

create table if not exists impostazioni_generali (
  id int primary key default 1,
  tasso_finanziamento_tan numeric(6,2) not null default 10.45,
  taeg_con_assicurazione numeric(6,2) not null default 15.95,
  taeg_senza_assicurazione numeric(6,2) not null default 16,
  spese_istruttoria numeric(10,2) not null default 400,
  spese_incasso_rata numeric(10,2) not null default 0,
  rapporto_assicurazione numeric(6,4) not null default 0.2227,

  constraint impostazioni_generali_singleton check (id = 1)
);

-- Riga unica con i valori di default, così la pagina Impostazioni
-- trova sempre qualcosa da leggere/aggiornare fin da subito.
insert into impostazioni_generali (id)
values (1)
on conflict (id) do nothing;

alter table impostazioni_generali enable row level security;

create policy "Autenticati leggono le impostazioni generali"
  on impostazioni_generali for select
  to authenticated
  using (true);

create policy "Autenticati modificano le impostazioni generali"
  on impostazioni_generali for update
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: cilindrata e note documento
-- Da eseguire su Supabase (SQL Editor) prima di usare il campo
-- "Cilindrata (Cc)" nel form annuncio e le "Note libere" nella
-- pagina Documenti di Vendita.
-- =====================================================

alter table annunci
  add column if not exists cilindrata_cc int,
  add column if not exists note_documento text;

-- =====================================================
-- GESTIONALE AUTOSALONE - Sito vetrina: richieste dal sito
-- Da eseguire su Supabase (SQL Editor). Sostituisce il localStorage del
-- browser con un salvataggio vero: ogni richiesta dai form del sito
-- (Contatti, Permuta, Test Drive) finisce qui, sempre, anche se poi
-- la mail di notifica dovesse fallire.
-- =====================================================

create table if not exists richieste_sito (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,              -- 'contatto' | 'permuta' | 'test_drive'
  nome text not null,
  email text,
  telefono text,
  dati jsonb not null default '{}'::jsonb,  -- resto dei campi specifici per tipo (auto interessata, km, targa, data test drive, ecc)
  letta boolean not null default false,     -- per segnare "già gestita" quando la guardi nel pannello
  creato_il timestamptz not null default now()
);

create index if not exists richieste_sito_tipo_idx on richieste_sito(tipo);
create index if not exists richieste_sito_creato_il_idx on richieste_sito(creato_il desc);

-- =====================================================
-- ROW LEVEL SECURITY
-- Chiunque (anche non autenticato, cioè i visitatori del sito) può INSERIRE
-- una richiesta tramite i form pubblici. Solo gli utenti autenticati del
-- pannello possono leggerle/gestirle.
-- =====================================================
alter table richieste_sito enable row level security;

create policy "Chiunque può inviare una richiesta dal sito"
  on richieste_sito for insert
  to anon, authenticated
  with check (true);

create policy "Autenticati leggono le richieste"
  on richieste_sito for select
  to authenticated
  using (true);

create policy "Autenticati aggiornano le richieste (es. segnano come lette)"
  on richieste_sito for update
  to authenticated
  using (true)
  with check (true);

create policy "Autenticati eliminano le richieste"
  on richieste_sito for delete
  to authenticated
  using (true);

-- =====================================================
-- PEZZI NON PRESENTI NELLE MIGRAZIONI ORIGINALI
-- (ricostruiti dal codice del gestionale)
-- =====================================================

-- Numerazione contratti: "2026-001", contatore atomico in impostazioni_generali
alter table impostazioni_generali
  add column if not exists prossimo_numero_progressivo int not null default 1;

create or replace function genera_numero_contratto()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update impostazioni_generali
     set prossimo_numero_progressivo = prossimo_numero_progressivo + 1
   where id = 1
  returning prossimo_numero_progressivo - 1 into n;
  return extract(year from now())::int || '-' || lpad(n::text, 3, '0');
end;
$$;
grant execute on function genera_numero_contratto() to authenticated;

-- Archivio documenti PDF generati
create table if not exists documenti_generati (
  id uuid primary key default gen_random_uuid(),
  annuncio_id uuid references annunci(id) on delete cascade,
  tipo text not null,
  tipo_label text not null,
  numero_contratto text,
  nome_file text not null,
  storage_path text not null,
  creato_il timestamptz not null default now()
);
create index if not exists documenti_generati_annuncio_idx on documenti_generati(annuncio_id, creato_il desc);

alter table documenti_generati enable row level security;
create policy "Autenticati gestiscono archivio documenti"
  on documenti_generati for all
  to authenticated
  using (true)
  with check (true);

-- Bucket privato per i PDF archiviati
insert into storage.buckets (id, name, public)
values ('documenti', 'documenti', false)
on conflict (id) do nothing;

create policy "Autenticati leggono documenti storage"
  on storage.objects for select to authenticated using (bucket_id = 'documenti');
create policy "Autenticati caricano documenti storage"
  on storage.objects for insert to authenticated with check (bucket_id = 'documenti');
create policy "Autenticati eliminano documenti storage"
  on storage.objects for delete to authenticated using (bucket_id = 'documenti');

-- =====================================================================
-- DEMO: auto di esempio + reset notturno
-- Le foto delle auto demo sono file statici del sito (/brand/auto-demo/),
-- così funzionano sia nel sito sia nel gestionale senza Storage.
-- =====================================================================
create or replace function reset_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- svuota tutto quello che i visitatori possono aver toccato
  delete from documenti_generati;
  delete from richieste_sito;
  delete from annuncio_foto;
  delete from annunci;
  update impostazioni_generali set
    tasso_finanziamento_tan = 9.95, taeg_con_assicurazione = 13.40, taeg_senza_assicurazione = 12.10,
    spese_istruttoria = 350, spese_incasso_rata = 0, rapporto_assicurazione = 0.2227,
    prossimo_numero_progressivo = 1
  where id = 1;

  -- file caricati dai visitatori: se Supabase non permette la delete diretta, li lasciamo (non danno fastidio)
  begin
    delete from storage.objects where bucket_id in ('annunci-foto', 'documenti');
  exception when others then null;
  end;

  insert into annunci (id, marca, modello, versione, prezzo, condizione, immatricolazione_mese, immatricolazione_anno, km,
    alimentazione, cambio, colore, carrozzeria, porte, posti, classe_emissioni, cv, cilindrata_cc, descrizione,
    accessori, stato_pubblicazione, targa, numero_proprietari, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'Volkswagen', 'Golf', '1.5 eTSI 150 CV EVO ACT DSG Life', 24900, 'Usato', 3, 2022, 34100,
    'Ibrida', 'Automatico', 'Grigio Moonstone', 'Berlina', '5', 5, 'Euro 6d', 150, 1498,
    'Golf ottava serie mild hybrid, unico proprietario, tagliandi ufficiali documentati. Cambio DSG fluido, consumi contenuti e tanta tecnologia di serie.',
    '["Navigatore","Apple CarPlay / Android Auto","Cruise control adattivo","Fari LED","Sensori di parcheggio","Climatizzatore automatico"]',
    'pubblicato', 'GA123BM', 1, now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000002', 'Jeep', 'Compass', '1.3 T4 PHEV 190 CV 4xe Limited', 27900, 'Usato', 6, 2021, 41200,
    'Ibrida', 'Automatico', 'Bianco Alpine', 'SUV', '5', 5, 'Euro 6d', 190, 1332,
    'Compass plug-in hybrid con trazione integrale elettrica 4xe: in città si va in elettrico, fuori porta si ha tutta la sicurezza di una 4x4.',
    '["Trazione integrale","Navigatore","Telecamera posteriore","Portellone elettrico","Sedili riscaldabili","Cerchi in lega 18\""]',
    'pubblicato', 'GB456BM', 1, now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000003', 'Fiat', '500e', 'Icon 118 CV 42 kWh', 18900, 'Usato', 9, 2023, 14500,
    'Elettrica', 'Automatico', 'Celestial Blue', 'City car', '3', 4, 'Euro 6d', 118, null,
    'La 500 tutta elettrica, perfetta per la città: fino a 300 km di autonomia, ricarica rapida e zero pensieri per ZTL e parcheggi.',
    '["Ricarica rapida","Navigatore","Apple CarPlay / Android Auto","Sensori di parcheggio","Fari LED"]',
    'pubblicato', 'GE789BM', 1, now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000004', 'Audi', 'A3 Sportback', '30 TDI S line S tronic', 25900, 'Usato', 4, 2021, 58000,
    'Diesel', 'Automatico', 'Nero Mythos', 'Berlina', '5', 5, 'Euro 6d', 116, 1968,
    'A3 Sportback in allestimento S line, interni sportivi e virtual cockpit. Diesel parco nei consumi, ideale per chi macina chilometri.',
    '["Virtual cockpit","Navigatore","Fari LED","Sedili sportivi","Sensori di parcheggio","Cerchi in lega 18\""]',
    'pubblicato', 'GC321BM', 2, now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000005', 'Toyota', 'Yaris Cross', '1.5 Hybrid 116 CV Lounge', 23900, 'Usato', 2, 2023, 18200,
    'Ibrida', 'Automatico', 'Rosso Tokyo', 'SUV', '5', 5, 'Euro 6d', 116, 1490,
    'Il SUV compatto full hybrid più amato: affidabilità Toyota, consumi da utilitaria e garanzia sulla batteria ibrida.',
    '["Head-up display","Navigatore","Telecamera posteriore","Cruise control adattivo","Climatizzatore automatico"]',
    'pubblicato', 'GF654BM', 1, now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000006', 'Peugeot', '2008', 'PureTech 130 S&S Allure Pack', 20500, 'Usato', 5, 2022, 29400,
    'Benzina', 'Manuale', 'Grigio Artense', 'SUV', '5', 5, 'Euro 6d', 130, 1199,
    'SUV compatto dal design deciso, i-Cockpit 3D e ottima abitabilità. Benzina brillante, perfetto per chi percorre pochi km all''anno.',
    '["i-Cockpit 3D","Navigatore","Telecamera posteriore","Sensori di parcheggio","Fari LED"]',
    'pubblicato', 'GD987BM', 1, now() - interval '6 days'),
  ('00000000-0000-4000-8000-000000000007', 'Mercedes-Benz', 'Classe A', 'A 180 d Automatic Sport', 28900, 'Usato', 10, 2021, 52000,
    'Diesel', 'Automatico', 'Argento Iridio', 'Berlina', '5', 5, 'Euro 6d', 116, 1461,
    'Classe A con sistema MBUX e assistente vocale, cambio automatico a doppia frizione e allestimento Sport.',
    '["MBUX con comandi vocali","Navigatore","Fari LED","Telecamera posteriore","Climatizzatore automatico bizona"]',
    'pubblicato', 'GA555BM', 1, now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000008', 'Alfa Romeo', 'Giulia', '2.2 Turbo Diesel 190 CV AT8 Veloce', 34900, 'Usato', 7, 2022, 43500,
    'Diesel', 'Automatico', 'Rosso Alfa', 'Berlina', '4', 5, 'Euro 6d', 190, 2143,
    'Giulia Veloce, la berlina sportiva italiana per eccellenza. In preparazione: foto e descrizione definitive in arrivo.',
    '["Navigatore","Sedili in pelle","Fari bi-xeno","Cerchi in lega 19\"","Palette al volante"]',
    'bozza', 'GB222BM', 1, now() - interval '8 days');

  insert into annuncio_foto (annuncio_id, url_originale, url_thumbnail, ordine)
  select ('00000000-0000-4000-8000-00000000000' || n)::uuid,
         '/brand/auto-demo/auto-0' || n || '.webp',
         '/brand/auto-demo/auto-0' || n || '.webp',
         0
  from generate_series(1, 8) as n;
end;
$$;

-- Prima popolazione
select reset_demo();

-- Reset automatico ogni notte alle 03:00 (UTC) con pg_cron
create extension if not exists pg_cron;
select cron.unschedule('reset-demo') where exists (select 1 from cron.job where jobname = 'reset-demo');
select cron.schedule('reset-demo', '0 3 * * *', 'select public.reset_demo()');
