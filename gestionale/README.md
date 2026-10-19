# Gestionale autosalone: annunci + documenti

Pannello React/Vite + Supabase per caricare e gestire annunci auto,
con upload foto ottimizzato (thumbnail + originale generati lato client).

## Setup

### 1. Crea progetto Supabase
Vai su supabase.com, crea un nuovo progetto (free tier).

### 2. Esegui lo schema SQL
Copia il contenuto di `sql/schema.sql` nel SQL Editor di Supabase e eseguilo.
Questo crea le tabelle, le RLS policies e il bucket storage `annunci-foto`.

### 3. Crea utente admin
Da Supabase Dashboard > Authentication > Users, crea un utente (email + password)
che sarà il login del pannello per il salone.

### 4. Configura variabili ambiente
Copia `.env.example` in `.env` e inserisci i valori da
Supabase Dashboard > Project Settings > API:
- Project URL → VITE_SUPABASE_URL
- anon/public key → VITE_SUPABASE_ANON_KEY

### 5. Installa e avvia
```bash
npm install
npm run dev
```

### 6. Deploy su Vercel (free)
```bash
npm install -g vercel
vercel
```
Aggiungi le stesse variabili ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
nel dashboard Vercel del progetto.

## Stile e design

Il pannello usa lo stesso design system del sito vetrina (Tailwind CSS v4):
- **Colori**: accento del cliente (`bg-brand`, `text-brand`), definito in `config/cliente.config.ts`
- **Dati azienda, logo, colore dei PDF**: tutto da `config/cliente.config.ts` e dalla cartella `brand/`
- **Font**: Outfit per i titoli, Inter per il testo (stessi Google Fonts del sito)
- **Icone**: lucide-react, stessa libreria del sito

## Marca / modello / versione

- **Marca**: dropdown con le marche più comuni sul mercato italiano dell'usato
- **Modello e versione**: campo libero di testo, con autocomplete che suggerisce
  automaticamente i valori già inseriti in precedenza (nessun database esterno
  da mantenere, il pannello "impara" dallo storico annunci)

## Come funziona l'upload foto

Quando carichi una foto, il browser genera automaticamente:
- **thumbnail** (max 400px, qualità 75%) → usata in liste e gallery, pesa pochi KB
- **originale** (max 1600px, qualità 80%) → usata per il dettaglio/zoom

Questo riduce drasticamente storage e banda consumati su Supabase.

## Sito vetrina pubblico

Il sito statico su cPanel legge gli annunci direttamente dalle API REST
di Supabase (auto-generate), filtrando solo `stato_pubblicazione = 'pubblicato'`
grazie alla RLS policy già configurata per la chiave anon.

Esempio chiamata dal sito statico:
```js
const res = await fetch(
  'https://tuoprogetto.supabase.co/rest/v1/annunci?stato_pubblicazione=eq.pubblicato&select=*,annuncio_foto(*)',
  {
    headers: {
      apikey: 'la-tua-anon-key',
      Authorization: 'Bearer la-tua-anon-key',
    },
  }
)
const annunci = await res.json()
```

## Note su banda e ottimizzazione

- Le immagini servite dall'URL pubblico Supabase Storage passano da CDN:
  il traffico servito da cache non pesa sull'egress.
- Nella pagina lista annunci del sito vetrina, usa sempre `url_thumbnail`,
  non `url_originale`. Carica l'originale solo nel dettaglio/zoom.
