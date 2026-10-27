-- =====================================================================
-- GESTIONALE AUTOSALONE - CRM: trattative, storico attività, richiami.
-- Additiva e sicura da rieseguire. Supabase > SQL Editor > New query > Run
-- =====================================================================

create table if not exists trattative (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefono text,
  email text,
  auto_interesse text,
  fonte text not null default 'Altro',
  stato text not null default 'nuovo'
    check (stato in ('nuovo', 'contattato', 'test_drive', 'preventivo', 'trattativa', 'venduto', 'perso')),
  valore numeric(10,2),
  commerciale_id uuid references commerciali(id) on delete set null,
  prossima_azione text,
  richiamo_il date,
  motivo_perso text,
  richiesta_id uuid references richieste_sito(id) on delete set null,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  chiuso_il timestamptz
);

create index if not exists trattative_stato_idx on trattative(stato);
create index if not exists trattative_richiamo_idx on trattative(richiamo_il);
create unique index if not exists trattative_richiesta_uq on trattative(richiesta_id) where richiesta_id is not null;

create table if not exists trattative_attivita (
  id uuid primary key default gen_random_uuid(),
  trattativa_id uuid not null references trattative(id) on delete cascade,
  tipo text not null default 'nota' check (tipo in ('nota', 'chiamata', 'email', 'visita', 'stadio')),
  testo text not null,
  autore text,
  creato_il timestamptz not null default now()
);

create index if not exists trattative_attivita_idx on trattative_attivita(trattativa_id, creato_il desc);

alter table trattative enable row level security;
alter table trattative_attivita enable row level security;

drop policy if exists "Autenticati gestiscono trattative" on trattative;
create policy "Autenticati gestiscono trattative" on trattative for all to authenticated using (true) with check (true);
drop policy if exists "Autenticati gestiscono attivita" on trattative_attivita;
create policy "Autenticati gestiscono attivita" on trattative_attivita for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- DEMO Autosalone Test: trattative di esempio, con date relative a oggi.
-- Lanciata da reset_demo_crm() (anche dopo il reset notturno).
-- ---------------------------------------------------------------------
create or replace function reset_demo_crm()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c_marco uuid := '00000000-0000-4000-9000-000000000002';
  c_giulia uuid := '00000000-0000-4000-9000-000000000003';
  c_luca uuid := '00000000-0000-4000-9000-000000000004';
  t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid;
begin
  delete from trattative_attivita;
  delete from trattative;

  insert into trattative (nome, telefono, email, auto_interesse, fonte, stato, valore, commerciale_id, prossima_azione, richiamo_il, creato_il, aggiornato_il) values
    ('Riccardo Zanin', '333 000 1101', 'riccardo.zanin@example.com', 'Volkswagen Golf 1.5 eTSI', 'Sito web', 'nuovo', 24900, null, 'Chiamare e proporre il test drive', current_date, now() - interval '2 hours', now() - interval '2 hours'),
    ('Elisa Moro', '333 000 1102', 'elisa.moro@example.com', 'Fiat 500e', 'Sito web', 'nuovo', 18900, null, 'Rispondere sul finanziamento', current_date, now() - interval '5 hours', now() - interval '5 hours'),
    ('Paola Dal Lago', '333 000 1104', 'paola.dl@example.com', 'Jeep Compass 4xe', 'Sito web', 'contattato', 27500, c_giulia, 'Passa giovedì con la sua Qashqai, preparare la valutazione', current_date + 2, now() - interval '3 days', now() - interval '1 day'),
    ('Tommaso Berti', '333 000 1105', 'tommaso.berti@example.com', 'Audi A3 Sportback 30 TDI', 'Sito web', 'test_drive', 25900, c_marco, 'Test drive martedì ore 18, poi preventivo', current_date + 1, now() - interval '4 days', now() - interval '2 days'),
    ('Giovanni Sartori', '347 555 0142', null, 'Toyota Yaris Hybrid', 'In salone', 'test_drive', 16900, c_luca, 'Ha provato la Yaris sabato, richiamare per la decisione', current_date - 2, now() - interval '6 days', now() - interval '2 days'),
    ('Martina Pellizzari', '338 555 0177', 'martina.p@example.com', 'Volkswagen T-Roc', 'AutoScout24', 'preventivo', 24900, c_giulia, 'Preventivo inviato, attende risposta della banca', current_date - 1, now() - interval '8 days', now() - interval '3 days'),
    ('Silvia Ceccato', '333 000 1106', 'silvia.ceccato@example.com', 'Mercedes Classe A', 'Sito web', 'trattativa', 27900, c_marco, 'Offerta a 27.900 con garanzia 24 mesi, attende risposta', current_date, now() - interval '9 days', now() - interval '1 day'),
    ('Laura Brunello', '333 000 1110', 'laura.brunello@example.com', 'Fiat Panda Hybrid', 'Sito web', 'trattativa', 11900, c_luca, 'Proporre la Panda in arrivo a fine mese', current_date + 5, now() - interval '14 days', now() - interval '3 days'),
    ('Enrico Bellotto', '349 555 0188', null, 'BMW X1', 'Passaparola', 'preventivo', 31900, c_marco, 'Valutare la sua permuta, Audi A4 del 2017', current_date + 3, now() - interval '10 days', now() - interval '4 days'),
    ('Andrea Cogo', '333 000 1109', 'andrea.cogo@example.com', 'Toyota Yaris Cross Hybrid', 'Sito web', 'venduto', 26500, c_marco, null, null, now() - interval '12 days', now() - interval '4 days'),
    ('Nicolò Furlan', '333 000 1113', 'nicolo.furlan@example.com', 'Jeep Compass 4xe', 'Sito web', 'venduto', 27500, c_marco, null, null, now() - interval '26 days', now() - interval '15 days'),
    ('Monica Grendene', '333 000 1108', 'monica.g@example.com', 'Peugeot 2008', 'Sito web', 'perso', 17900, c_giulia, null, null, now() - interval '9 days', now() - interval '6 days');

  update trattative set chiuso_il = aggiornato_il where stato in ('venduto', 'perso');
  update trattative set motivo_perso = 'Ha comprato altrove, cercava il cambio automatico' where stato = 'perso';

  select id into t1 from trattative where nome = 'Silvia Ceccato';
  select id into t2 from trattative where nome = 'Martina Pellizzari';
  select id into t3 from trattative where nome = 'Giovanni Sartori';
  select id into t4 from trattative where nome = 'Tommaso Berti';
  select id into t5 from trattative where nome = 'Laura Brunello';

  insert into trattative_attivita (trattativa_id, tipo, testo, autore, creato_il) values
    (t1, 'chiamata', 'Primo contatto: cerca una Classe A sotto i 28.000 €, ha già visto la nostra online.', 'Marco Rigon', now() - interval '8 days'),
    (t1, 'visita', 'Passata in salone, ha provato la Classe A. Molto convinta.', 'Marco Rigon', now() - interval '5 days'),
    (t1, 'nota', 'Offerta a 27.900 con garanzia 24 mesi. Vuole pensarci con il marito.', 'Marco Rigon', now() - interval '1 day'),
    (t2, 'email', 'Inviato il preventivo con finanziamento a 48 rate.', 'Giulia Zanon', now() - interval '3 days'),
    (t2, 'chiamata', 'Attende l''esito della banca, risentirci domani.', 'Giulia Zanon', now() - interval '1 day'),
    (t3, 'visita', 'Test drive della Yaris Hybrid, buone impressioni. Il prezzo è il suo dubbio.', 'Luca Bertoldo', now() - interval '3 days'),
    (t4, 'chiamata', 'Concordato il test drive per martedì alle 18.', 'Marco Rigon', now() - interval '2 days'),
    (t5, 'nota', 'La Panda in arrivo a fine mese fa al caso suo. Ha la figlia neopatentata.', 'Luca Bertoldo', now() - interval '3 days');
end;
$$;

select reset_demo_crm();

-- Dopo il reset notturno della demo (03:00 UTC) rigenera anche le trattative
select cron.unschedule('reset-demo-crm') where exists (select 1 from cron.job where jobname = 'reset-demo-crm');
select cron.schedule('reset-demo-crm', '5 3 * * *', 'select public.reset_demo_crm()');
