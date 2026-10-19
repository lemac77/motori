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
