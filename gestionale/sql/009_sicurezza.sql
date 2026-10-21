-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione sicurezza (additiva, sicura da rilanciare)
-- 1. I visitatori del sito vedono solo le colonne pubbliche degli annunci
-- 2. Limiti di dimensione sulle richieste dal sito
-- 3. Limiti su dimensione e tipo dei file caricati
-- =====================================================

-- 1) Prima l'RLS mostrava agli anonimi TUTTE le colonne degli annunci pubblicati,
--    compresi prezzo di acquisto, costi di ripristino, telaio, targa e dati cliente
--    (basta la chiave pubblica del sito per interrogare l'API). Ora l'accesso anonimo
--    è limitato per colonna a ciò che il sito mostra davvero.
revoke select on table public.annunci from anon;
grant select (
  id, marca, modello, versione, prezzo, km, immatricolazione_anno, alimentazione, cambio, cv,
  descrizione, condizione, colore, carrozzeria, porte, posti, classe_emissioni, accessori,
  stato_pubblicazione, created_at
) on table public.annunci to anon;
-- Nota: le colonne aggiunte in futuro NON sono visibili agli anonimi finché non le elenchi qui.

-- 2) Richieste dal sito: chiunque può inserire, ma con limiti di dimensione
do $$ begin
  alter table public.richieste_sito add constraint richieste_sito_limiti check (
    char_length(nome) <= 200
    and char_length(coalesce(email, '')) <= 200
    and char_length(coalesce(telefono, '')) <= 60
    and pg_column_size(dati) <= 6000
  ) not valid;
exception when duplicate_object then null;
end $$;

-- 3) Storage: dimensione massima e tipi ammessi
update storage.buckets
   set file_size_limit = 8 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'annunci-foto';

update storage.buckets
   set file_size_limit = 15 * 1024 * 1024,
       allowed_mime_types = array['application/pdf']
 where id = 'documenti';
