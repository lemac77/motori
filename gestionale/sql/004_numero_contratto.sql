-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: numero contratto
-- Da eseguire su Supabase (SQL Editor) prima di usare il campo
-- "Numero contratto" nella pagina Documenti di Vendita.
-- =====================================================

alter table annunci
  add column if not exists numero_contratto text;
