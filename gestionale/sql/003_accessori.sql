-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: accessori annuncio
-- Da eseguire su Supabase (SQL Editor) prima di usare la nuova
-- sezione "Accessori" nel form annuncio.
-- =====================================================

alter table annunci
  add column if not exists accessori jsonb;
