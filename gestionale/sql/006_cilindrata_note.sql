-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: cilindrata e note documento
-- Da eseguire su Supabase (SQL Editor) prima di usare il campo
-- "Cilindrata (Cc)" nel form annuncio e le "Note libere" nella
-- pagina Documenti di Vendita.
-- =====================================================

alter table annunci
  add column if not exists cilindrata_cc int,
  add column if not exists note_documento text;
