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
