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

## Gestionale: vendite, team, richieste, scadenze

- **Vendite** (`/vendite`): KPI, andamento mensile, cosa si vende (marca, modello, alimentazione, carrozzeria, fascia prezzo/km), per commerciale, zone (province e comuni), canali, stock fermo, ultime vendite.
- **Registra vendita**: passando un annuncio a "Venduto" si apre la scheda (data, prezzo reale, commerciale, canale, cliente, garanzia aggiuntiva).
- **Team** (Impostazioni): titolare e commerciali. Chi accede con l'email di un commerciale vede solo le sue vendite e richieste, senza prezzi di acquisto e margini. Il titolare può usare "Vista come" per vedere il gestionale con i permessi di un commerciale.
- **Richieste** (`/richieste`): mini CRM delle richieste arrivate dai form del sito, con stato, assegnazione e note.
- **Scadenze** (`/scadenze`): revisioni e bolli delle auto in stock, clienti a 12 mesi dalla consegna (tagliando + estensione garanzia), garanzie estese in scadenza.

Database: `gestionale/sql/007_analitiche.sql` (migrazione). Per la demo già installata: `gestionale/sql/demo-update-007.sql`.
Nota: i permessi per ruolo sono applicati nell'interfaccia; per un cliente con più commerciali reali vanno blindati anche con policy RLS.
