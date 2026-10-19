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
