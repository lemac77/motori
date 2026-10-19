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

-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: commerciali, dati di vendita,
-- stato richieste (mini CRM). Additiva: si può lanciare su un DB esistente.
-- =====================================================

-- Commerciali / utenti del salone
create table if not exists commerciali (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text,
  -- se coincide con l'email di login, il gestionale applica il ruolo a quell'utente
  email text,
  ruolo text not null default 'commerciale' check (ruolo in ('titolare', 'commerciale')),
  attivo boolean not null default true,
  creato_il timestamptz not null default now()
);

alter table commerciali enable row level security;
drop policy if exists "Autenticati gestiscono commerciali" on commerciali;
create policy "Autenticati gestiscono commerciali"
  on commerciali for all to authenticated using (true) with check (true);

-- Dati di vendita sull'annuncio
alter table annunci
  add column if not exists venduto_il date,
  add column if not exists prezzo_acquisto numeric(10,2),
  add column if not exists costi_ripristino numeric(10,2),
  add column if not exists commerciale_id uuid references commerciali(id) on delete set null,
  add column if not exists canale_vendita text;

create index if not exists idx_annunci_venduto_il on annunci(venduto_il);
create index if not exists idx_annunci_commerciale on annunci(commerciale_id);

-- Richieste dal sito: stato, assegnazione, note
alter table richieste_sito
  add column if not exists stato text not null default 'nuova',
  add column if not exists commerciale_id uuid references commerciali(id) on delete set null,
  add column if not exists note text,
  add column if not exists aggiornato_il timestamptz;

do $$ begin
  alter table richieste_sito add constraint richieste_sito_stato_check
    check (stato in ('nuova', 'contattato', 'test_drive', 'trattativa', 'venduto', 'perso'));
exception when duplicate_object then null;
end $$;

-- Promemoria già gestiti (pagina Scadenze): revisione, bollo, garanzia, tagliando
create table if not exists promemoria_fatti (
  id uuid primary key default gen_random_uuid(),
  annuncio_id uuid not null references annunci(id) on delete cascade,
  tipo text not null check (tipo in ('revisione', 'bollo', 'garanzia', 'tagliando')),
  fatto_il timestamptz not null default now(),
  unique (annuncio_id, tipo)
);
alter table promemoria_fatti enable row level security;
drop policy if exists "Autenticati gestiscono promemoria" on promemoria_fatti;
create policy "Autenticati gestiscono promemoria"
  on promemoria_fatti for all to authenticated using (true) with check (true);

-- =====================================================================
-- DEMO Berica Motori: funzione reset_demo()
-- Riporta il database allo stato iniziale della demo:
--  - 4 utenti (titolare + 3 commerciali)
--  - 8 auto in stock (con foto statiche in /brand/auto-demo/)
--  - ~90 auto vendute negli ultimi 12 mesi (per le analitiche)
--  - richieste dal sito in vari stati (mini CRM)
--  - scadenze vicine (revisione, bollo, garanzie, tagliandi)
-- Tutte le date sono relative a oggi, quindi la demo resta sempre "fresca".
-- Chiamata ogni notte da pg_cron ('reset-demo').
-- =====================================================================
create or replace function reset_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- catalogo usato per le vendite storiche: marca, modello, alimentazione, carrozzeria, prezzo base
  cat text[][] := array[
    ['Fiat','Panda','Ibrida','City car','11900'],
    ['Fiat','500','Ibrida','City car','13500'],
    ['Fiat','Tipo','Benzina','Berlina','14900'],
    ['Volkswagen','Polo','Benzina','City car','15900'],
    ['Volkswagen','Golf','Diesel','Berlina','22900'],
    ['Volkswagen','T-Roc','Benzina','SUV','24900'],
    ['Toyota','Yaris','Ibrida','City car','16900'],
    ['Toyota','C-HR','Ibrida','SUV','24500'],
    ['Renault','Clio','GPL','City car','13900'],
    ['Renault','Captur','GPL','SUV','18500'],
    ['Dacia','Sandero','GPL','City car','11500'],
    ['Dacia','Duster','GPL','SUV','16900'],
    ['Peugeot','208','Benzina','City car','15500'],
    ['Peugeot','3008','Diesel','SUV','23900'],
    ['Jeep','Renegade','Diesel','SUV','19900'],
    ['Jeep','Compass','Ibrida','SUV','27500'],
    ['Audi','A3','Diesel','Berlina','25900'],
    ['Audi','Q3','Diesel','SUV','32900'],
    ['BMW','Serie 1','Diesel','Berlina','24900'],
    ['BMW','X1','Diesel','SUV','31900'],
    ['Mercedes-Benz','Classe A','Diesel','Berlina','27900'],
    ['Ford','Puma','Ibrida','SUV','20900'],
    ['Kia','Sportage','Ibrida','SUV','26900'],
    ['Tesla','Model 3','Elettrica','Berlina','33900']
  ];
  -- peso di ogni modello (quante "estrazioni" su 100): Panda, Yaris e Clio vanno forte, Tesla e Q3 poco
  pesi int[] := array[9,6,3,5,6,5,8,4,7,5,6,5,4,3,4,3,3,1,3,1,2,4,2,1];
  -- province clienti (Veneto)
  prov text[] := array['VI','VI','VI','VI','VI','VI','VI','VI','VI','PD','PD','PD','PD','VR','VR','VR','TV','TV','VE','RO'];
  citta_vi text[] := array['Vicenza','Bassano del Grappa','Schio','Thiene','Arzignano','Valdagno','Montecchio Maggiore','Lonigo','Noventa Vicentina'];
  citta jsonb := '{"PD":["Padova","Cittadella","Este"],"VR":["Verona","San Bonifacio","Legnago"],"TV":["Treviso","Castelfranco Veneto"],"VE":["Mestre","Noale"],"RO":["Rovigo","Badia Polesine"]}';
  canali text[] := array['Sito web','Sito web','Sito web','Sito web','Sito web','Sito web','Sito web','AutoScout24','AutoScout24','AutoScout24','AutoScout24','AutoScout24','Passaparola','Passaparola','Passaparola','In salone','In salone','In salone','Subito.it','Subito.it'];
  nomi text[] := array['Marco','Giulia','Luca','Francesca','Andrea','Sara','Matteo','Elena','Davide','Chiara','Alessandro','Martina','Stefano','Valentina','Paolo','Federica','Simone','Laura','Nicola','Anna'];
  cognomi text[] := array['Dalla Valle','Zanella','Bortolan','Cracco','Rigon','Pellizzari','Tonin','Zordan','Fabris','Battistella','Carollo','Dal Santo','Sartori','Marchetto','Pozza','Visentin','Bertoldo','Cavedon','Lovato','Piccoli'];
  -- commerciali (id fissi): Marco Rigon chiude di più, Luca Bertoldo meno
  c_titolare uuid := '00000000-0000-4000-9000-000000000001';
  c_marco uuid := '00000000-0000-4000-9000-000000000002';
  c_giulia uuid := '00000000-0000-4000-9000-000000000003';
  c_luca uuid := '00000000-0000-4000-9000-000000000004';
  i int; k int; acc int; r double precision; idx int; p text; cit text;
  d_vendita date; d_ingresso date; prezzo_v numeric; listino numeric; acquisto numeric; comm uuid;
begin
  perform setseed(0.4242);

  -- ---------- pulizia ----------
  delete from promemoria_fatti;
  delete from documenti_generati;
  delete from richieste_sito;
  delete from annuncio_foto;
  delete from annunci;
  delete from commerciali;
  update impostazioni_generali set
    tasso_finanziamento_tan = 9.95, taeg_con_assicurazione = 13.40, taeg_senza_assicurazione = 12.10,
    spese_istruttoria = 350, spese_incasso_rata = 0, rapporto_assicurazione = 0.2227,
    prossimo_numero_progressivo = 1
  where id = 1;
  begin
    delete from storage.objects where bucket_id in ('annunci-foto', 'documenti');
  exception when others then null;
  end;

  -- ---------- utenti ----------
  insert into commerciali (id, nome, cognome, email, ruolo) values
    (c_titolare, 'Account', 'Demo', 'demo@bericamotori.it', 'titolare'),
    (c_marco, 'Marco', 'Rigon', 'marco.rigon@bericamotori.it', 'commerciale'),
    (c_giulia, 'Giulia', 'Zanon', 'giulia.zanon@bericamotori.it', 'commerciale'),
    (c_luca, 'Luca', 'Bertoldo', 'luca.bertoldo@bericamotori.it', 'commerciale');

  -- ---------- auto in stock (vetrina) ----------
  insert into annunci (id, marca, modello, versione, prezzo, condizione, immatricolazione_mese, immatricolazione_anno, km,
    alimentazione, cambio, colore, carrozzeria, porte, posti, classe_emissioni, cv, cilindrata_cc, descrizione,
    accessori, stato_pubblicazione, targa, numero_proprietari, prezzo_acquisto, costi_ripristino,
    scadenza_revisione, scadenza_bollo, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'Volkswagen', 'Golf', '1.5 eTSI 150 CV EVO ACT DSG Life', 24900, 'Usato', 3, 2022, 34100,
    'Ibrida', 'Automatico', 'Grigio Moonstone', 'Berlina', '5', 5, 'Euro 6d', 150, 1498,
    'Golf ottava serie mild hybrid, unico proprietario, tagliandi ufficiali documentati. Cambio DSG fluido, consumi contenuti e tanta tecnologia di serie.',
    '["Navigatore","Apple CarPlay / Android Auto","Cruise control adattivo","Fari LED","Sensori di parcheggio","Climatizzatore automatico"]',
    'pubblicato', 'GA123BM', 1, 20500, 650, current_date + 18, current_date + 120, now() - interval '12 days'),
  ('00000000-0000-4000-8000-000000000002', 'Jeep', 'Compass', '1.3 T4 PHEV 190 CV 4xe Limited', 27900, 'Usato', 6, 2021, 41200,
    'Ibrida', 'Automatico', 'Bianco Alpine', 'SUV', '5', 5, 'Euro 6d', 190, 1332,
    'Compass plug-in hybrid con trazione integrale elettrica 4xe: in città si va in elettrico, fuori porta si ha tutta la sicurezza di una 4x4.',
    '["Trazione integrale","Navigatore","Telecamera posteriore","Portellone elettrico","Sedili riscaldabili","Cerchi in lega 18 pollici"]',
    'pubblicato', 'GB456BM', 1, 23200, 900, current_date + 200, current_date - 6, now() - interval '34 days'),
  ('00000000-0000-4000-8000-000000000003', 'Fiat', '500e', 'Icon 118 CV 42 kWh', 18900, 'Usato', 9, 2023, 14500,
    'Elettrica', 'Automatico', 'Celestial Blue', 'City car', '3', 4, 'Euro 6d', 118, null,
    'La 500 tutta elettrica, perfetta per la città: fino a 300 km di autonomia, ricarica rapida e zero pensieri per ZTL e parcheggi.',
    '["Ricarica rapida","Navigatore","Apple CarPlay / Android Auto","Sensori di parcheggio","Fari LED"]',
    'pubblicato', 'GE789BM', 1, 15400, 300, current_date + 400, current_date + 60, now() - interval '9 days'),
  ('00000000-0000-4000-8000-000000000004', 'Audi', 'A3 Sportback', '30 TDI S line S tronic', 25900, 'Usato', 4, 2021, 58000,
    'Diesel', 'Automatico', 'Nero Mythos', 'Berlina', '5', 5, 'Euro 6d', 116, 1968,
    'A3 Sportback in allestimento S line, interni sportivi e virtual cockpit. Diesel parco nei consumi, ideale per chi macina chilometri.',
    '["Virtual cockpit","Navigatore","Fari LED","Sedili sportivi","Sensori di parcheggio","Cerchi in lega 18 pollici"]',
    'pubblicato', 'GC321BM', 2, 21900, 1200, current_date + 25, current_date + 90, now() - interval '97 days'),
  ('00000000-0000-4000-8000-000000000005', 'Toyota', 'Yaris Cross', '1.5 Hybrid 116 CV Lounge', 23900, 'Usato', 2, 2023, 18200,
    'Ibrida', 'Automatico', 'Rosso Tokyo', 'SUV', '5', 5, 'Euro 6d', 116, 1490,
    'Il SUV compatto full hybrid più amato: affidabilità Toyota, consumi da utilitaria e garanzia sulla batteria ibrida.',
    '["Head-up display","Navigatore","Telecamera posteriore","Cruise control adattivo","Climatizzatore automatico"]',
    'pubblicato', 'GF654BM', 1, 20100, 400, current_date + 500, current_date + 150, now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000006', 'Peugeot', '2008', 'PureTech 130 S&S Allure Pack', 20500, 'Usato', 5, 2022, 29400,
    'Benzina', 'Manuale', 'Grigio Artense', 'SUV', '5', 5, 'Euro 6d', 130, 1199,
    'SUV compatto dal design deciso, i-Cockpit 3D e ottima abitabilità. Benzina brillante, perfetto per chi percorre pochi km all''anno.',
    '["i-Cockpit 3D","Navigatore","Telecamera posteriore","Sensori di parcheggio","Fari LED"]',
    'pubblicato', 'GD987BM', 1, 17200, 550, current_date - 3, current_date + 40, now() - interval '61 days'),
  ('00000000-0000-4000-8000-000000000007', 'Mercedes-Benz', 'Classe A', 'A 180 d Automatic Sport', 28900, 'Usato', 10, 2021, 52000,
    'Diesel', 'Automatico', 'Argento Iridio', 'Berlina', '5', 5, 'Euro 6d', 116, 1461,
    'Classe A con sistema MBUX e assistente vocale, cambio automatico a doppia frizione e allestimento Sport.',
    '["MBUX con comandi vocali","Navigatore","Fari LED","Telecamera posteriore","Climatizzatore automatico bizona"]',
    'pubblicato', 'GA555BM', 1, 24600, 800, current_date + 300, current_date + 12, now() - interval '128 days'),
  ('00000000-0000-4000-8000-000000000008', 'Alfa Romeo', 'Giulia', '2.2 Turbo Diesel 190 CV AT8 Veloce', 34900, 'Usato', 7, 2022, 43500,
    'Diesel', 'Automatico', 'Rosso Alfa', 'Berlina', '4', 5, 'Euro 6d', 190, 2143,
    'Giulia Veloce, la berlina sportiva italiana per eccellenza. In preparazione: foto e descrizione definitive in arrivo.',
    '["Navigatore","Sedili in pelle","Fari bi-xeno","Cerchi in lega 19 pollici","Palette al volante"]',
    'bozza', 'GB222BM', 1, 29800, 1500, current_date + 220, current_date + 75, now() - interval '3 days');

  insert into annuncio_foto (annuncio_id, url_originale, url_thumbnail, ordine)
  select ('00000000-0000-4000-8000-00000000000' || n)::uuid,
         '/brand/auto-demo/auto-0' || n || '.webp',
         '/brand/auto-demo/auto-0' || n || '.webp', 0
  from generate_series(1, 8) as n;

  -- ---------- storico vendite (ultimi 12 mesi, trend in crescita) ----------
  for i in 1..92 loop
    -- modello pesato
    r := random() * 100; acc := 0; idx := 1;
    for k in 1..array_length(pesi, 1) loop
      acc := acc + pesi[k];
      if r < acc then idx := k; exit; end if;
    end loop;

    -- più vendite recenti che vecchie, mai nel futuro
    d_vendita := current_date - floor(365 * power(random(), 1.35))::int;
    d_ingresso := d_vendita - (8 + floor(random() * 75))::int;
    prezzo_v := round((cat[idx][5]::numeric * (0.85 + random() * 0.3)) / 100) * 100;
    listino := prezzo_v + round(random() * 6) * 100;
    acquisto := round((prezzo_v * (0.76 + random() * 0.1)) / 100) * 100;

    r := random();
    comm := case when r < 0.42 then c_marco when r < 0.77 then c_giulia else c_luca end;

    p := prov[1 + floor(random() * array_length(prov, 1))::int];
    if p = 'VI' then
      cit := citta_vi[1 + floor(random() * array_length(citta_vi, 1))::int];
    else
      cit := citta->p->>(floor(random() * jsonb_array_length(citta->p))::int);
    end if;

    insert into annunci (marca, modello, prezzo, condizione, immatricolazione_anno, km, alimentazione, cambio,
      carrozzeria, stato_pubblicazione, created_at, venduto_il, prezzo_finale_vendita, prezzo_acquisto, costi_ripristino,
      commerciale_id, canale_vendita, cliente_nome, cliente_cognome, cliente_citta, cliente_provincia, cliente_cellulare,
      garanzia_aggiuntiva_mesi, targa)
    values (cat[idx][1], cat[idx][2], listino, 'Usato', extract(year from d_vendita)::int - (1 + floor(random() * 6))::int,
      (5000 + floor(random() * 110000))::int, cat[idx][3],
      case when random() < 0.55 then 'Automatico' else 'Manuale' end,
      cat[idx][4], 'venduto', d_ingresso::timestamptz, d_vendita, prezzo_v, acquisto,
      round((200 + random() * 1300) / 50) * 50,
      comm, canali[1 + floor(random() * array_length(canali, 1))::int],
      nomi[1 + floor(random() * 20)::int], cognomi[1 + floor(random() * 20)::int], cit, p,
      '333 000 ' || lpad(i::text, 4, '0'),
      case when random() < 0.6 then 0 when random() < 0.7 then 12 else 24 end,
      'GX' || lpad(i::text, 3, '0') || 'BM');
  end loop;

  -- un paio di vendite di 11-12 mesi fa, così le scadenze garanzia/tagliando non sono mai vuote
  update annunci set
    venduto_il = current_date - interval '12 months' + (n.k * 6 || ' days')::interval,
    created_at = current_date - interval '13 months' + (n.k * 6 || ' days')::interval,
    garanzia_aggiuntiva_mesi = 0
  from (select id, row_number() over (order by venduto_il) as k from annunci where stato_pubblicazione = 'venduto' limit 4) n
  where annunci.id = n.id;

  -- tre clienti di quasi 2 anni fa con garanzia estesa di 12 mesi in scadenza
  update annunci set
    venduto_il = current_date - interval '24 months' + (n.k * 9 || ' days')::interval,
    created_at = current_date - interval '25 months' + (n.k * 9 || ' days')::interval,
    garanzia_aggiuntiva_mesi = 12
  from (select id, row_number() over (order by venduto_il desc) as k from annunci
        where stato_pubblicazione = 'venduto' and garanzia_aggiuntiva_mesi = 0 order by venduto_il desc limit 3) n
  where annunci.id = n.id;

  -- ---------- richieste dal sito (mini CRM) ----------
  insert into richieste_sito (tipo, nome, email, telefono, dati, stato, commerciale_id, note, creato_il, aggiornato_il) values
    ('test_drive', 'Riccardo Zanin', 'riccardo.zanin@example.com', '333 000 1101', '{"auto":"Volkswagen Golf 1.5 eTSI","dataDesiderata":"sabato mattina","fasciaOraria":"10-12"}', 'nuova', null, null, now() - interval '2 hours', null),
    ('contatto', 'Elisa Moro', 'elisa.moro@example.com', '333 000 1102', '{"auto_interesse":"Fiat 500e","messaggio":"Buongiorno, la 500e è ancora disponibile? Avete formule di finanziamento senza anticipo?","provincia":"VI"}', 'nuova', null, null, now() - interval '5 hours', null),
    ('permuta', 'Gianni Fontana', 'g.fontana@example.com', '333 000 1103', '{"marcaModello":"Opel Corsa 1.2","dataImmatricolazione":"2016","km":"98000","alimentazione":"Benzina","note":"Interessato alla Yaris Cross"}', 'nuova', null, null, now() - interval '1 day', null),
    ('contatto', 'Paola Dal Lago', 'paola.dl@example.com', '333 000 1104', '{"auto_interesse":"Jeep Compass 4xe","messaggio":"Vorrei un preventivo con permuta","provincia":"PD"}', 'contattato', c_giulia, 'Richiamata, passa giovedì con la sua Qashqai', now() - interval '2 days', now() - interval '1 day'),
    ('test_drive', 'Tommaso Berti', 'tommaso.berti@example.com', '333 000 1105', '{"auto":"Audi A3 Sportback 30 TDI","dataDesiderata":"martedì","fasciaOraria":"17-19"}', 'test_drive', c_marco, 'Test drive fissato martedì ore 18', now() - interval '3 days', now() - interval '2 days'),
    ('contatto', 'Silvia Ceccato', 'silvia.ceccato@example.com', '333 000 1106', '{"auto_interesse":"Mercedes Classe A","messaggio":"Si può trattare sul prezzo?","provincia":"VI"}', 'trattativa', c_marco, 'Offerta a 27.900 con garanzia 24 mesi', now() - interval '4 days', now() - interval '1 day'),
    ('permuta', 'Fabio Lazzarin', 'fabio.l@example.com', '333 000 1107', '{"marcaModello":"Renault Clio dCi","dataImmatricolazione":"2015","km":"142000","alimentazione":"Diesel"}', 'contattato', c_luca, 'Valutazione indicativa 3.500 €, deve portarla a vedere', now() - interval '6 days', now() - interval '5 days'),
    ('contatto', 'Monica Grendene', 'monica.g@example.com', '333 000 1108', '{"auto_interesse":"Peugeot 2008","messaggio":"Avete la versione automatica?","provincia":"VR"}', 'perso', c_giulia, 'Ha comprato altrove, cercava automatico', now() - interval '9 days', now() - interval '6 days'),
    ('test_drive', 'Andrea Cogo', 'andrea.cogo@example.com', '333 000 1109', '{"auto":"Toyota Yaris Cross Hybrid","dataDesiderata":"venerdì","fasciaOraria":"15-17"}', 'venduto', c_marco, 'Venduta! Consegna tra 10 giorni', now() - interval '12 days', now() - interval '4 days'),
    ('contatto', 'Laura Brunello', 'laura.brunello@example.com', '333 000 1110', '{"auto_interesse":"Fiat Panda Hybrid","messaggio":"Cerco una Panda per mia figlia neopatentata","provincia":"VI"}', 'trattativa', c_luca, 'Proporre Panda in arrivo a fine mese', now() - interval '14 days', now() - interval '3 days'),
    ('contatto', 'Stefano Peruzzo', 'ste.peruzzo@example.com', '333 000 1111', '{"auto_interesse":"Golf","messaggio":"Fate consegna a Treviso?","provincia":"TV"}', 'venduto', c_giulia, 'Chiusa con consegna a domicilio', now() - interval '18 days', now() - interval '10 days'),
    ('permuta', 'Ivana Rossato', 'ivana.r@example.com', '333 000 1112', '{"marcaModello":"Fiat Punto","dataImmatricolazione":"2012","km":"160000","alimentazione":"GPL"}', 'perso', c_luca, 'Valutazione troppo bassa per lei', now() - interval '21 days', now() - interval '19 days'),
    ('test_drive', 'Nicolò Furlan', 'nicolo.furlan@example.com', '333 000 1113', '{"auto":"Jeep Compass 4xe","dataDesiderata":"sabato","fasciaOraria":"9-11"}', 'venduto', c_marco, null, now() - interval '26 days', now() - interval '15 days'),
    ('contatto', 'Beatrice Sella', 'bea.sella@example.com', '333 000 1114', '{"auto_interesse":"Toyota C-HR","messaggio":"Info su garanzia batteria ibrida","provincia":"PD"}', 'contattato', c_giulia, 'Inviata scheda garanzia via mail', now() - interval '30 days', now() - interval '28 days'),
    ('contatto', 'Diego Pasqualotto', 'diego.p@example.com', '333 000 1115', '{"auto_interesse":"BMW X1","messaggio":"Avete X1 con meno di 60.000 km?","provincia":"VI"}', 'perso', c_marco, 'Nessuna disponibilità', now() - interval '35 days', now() - interval '33 days'),
    ('test_drive', 'Arianna Toffanin', 'arianna.t@example.com', '333 000 1116', '{"auto":"Renault Captur GPL","dataDesiderata":"mercoledì","fasciaOraria":"18-19"}', 'venduto', c_luca, null, now() - interval '41 days', now() - interval '30 days'),
    ('contatto', 'Michele Guerra', 'michele.guerra@example.com', '333 000 1117', '{"auto_interesse":"Dacia Duster GPL","messaggio":"Prezzo finale con passaggio?","provincia":"RO"}', 'venduto', c_giulia, null, now() - interval '47 days', now() - interval '38 days'),
    ('permuta', 'Roberta Pegoraro', 'roberta.p@example.com', '333 000 1118', '{"marcaModello":"VW Polo","dataImmatricolazione":"2017","km":"88000","alimentazione":"Benzina"}', 'venduto', c_marco, 'Permuta + Golf', now() - interval '55 days', now() - interval '44 days');
end;
$$;

-- Prima popolazione
select reset_demo();

-- Reset automatico ogni notte alle 03:00 (UTC) con pg_cron
create extension if not exists pg_cron;
select cron.unschedule('reset-demo') where exists (select 1 from cron.job where jobname = 'reset-demo');
select cron.schedule('reset-demo', '0 3 * * *', 'select public.reset_demo()');
