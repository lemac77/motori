# Template autosalone (nome prodotto da decidere)

Sito vetrina + gestionale per autosaloni. Un repo per cliente, tutto il brand in un posto solo.

```
config/cliente.config.ts       <- UNICO file da compilare per un nuovo salone
config/tipi.ts                 <- struttura del config (campi documentati)
config/helpers.ts              <- formattazioni comuni (indirizzi, tel, orari, colori)
config/vite-plugin-cliente.ts  <- inietta colori/titoli, serve /brand in entrambe le app
brand/                         <- logo chiaro, logo scuro, logo PNG per i PDF
sito/                          <- sito vetrina (React 19, Vite 6, Tailwind 4)
gestionale/                    <- pannello annunci + documenti PDF (React 18, Vite 5, jsPDF)
```

Avvio: `npm run install:all`, poi `npm run dev:sito` / `npm run dev:gestionale`.
Ogni app vuole il suo `.env` con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (vedi `.env.example`).

## Demo Berica Motori (stato attuale del config)

1. **Supabase**: SQL Editor → incolla `gestionale/sql/demo-setup.sql` → Run (tabelle, permessi, bucket, auto demo, reset notturno alle 03:00 UTC).
   Poi Authentication → Users → Add user: `demo@bericamotori.it` / `BericaDemo2026` (spunta "Auto confirm"). Consigliato: Authentication → Sign In / Providers → disattiva "Allow new users to sign up".
2. **Vercel**: due progetti dallo stesso repo, Root Directory `sito` e `gestionale`, framework Vite. Le chiavi Supabase (pubbliche) sono già in `.env.production`.
3. Quando hai gli URL, compila `demoInfo.urlSito` / `urlGestionale` in `config/cliente.config.ts` e fai push: compaiono i link incrociati nelle barre demo.

Nuovo cliente vero: `demo: false`, compila `config/cliente.config.ts`, sostituisci i file in `brand/`, le foto in `sito/src/assets/images/` e le favicon in `*/public/`.
