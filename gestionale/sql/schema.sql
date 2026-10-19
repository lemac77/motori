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
