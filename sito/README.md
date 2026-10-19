# Sito vetrina autosalone

React 19 + Vite 6 + Tailwind 4. Legge gli annunci pubblicati dal Supabase del gestionale.
Nome, contatti, colori, SEO e tracking arrivano da `../config/cliente.config.ts`.

```bash
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev            # http://localhost:3000
npm run build          # dist/ con robots.txt e sitemap.xml generati dal config
```

- **SEO**: title/meta/OG/JSON-LD generati nel build (`config/seo-head.ts`), meta per pagina in `src/lib/seoPagine.ts`
- **Tracking**: GA4/GTM caricati solo se gli ID sono nel config, mai in demo, solo dopo consenso cookie (`src/lib/tracking.ts`)
- **Recensioni**: Featurable o Trustindex in base all'ID compilato (`src/components/WidgetRecensioni.tsx`)
- **Form**: salvati su Supabase (`richieste_sito`, vedi `supabase-migration-richieste-sito.sql`) + notifica mail via Edge Function Resend (`supabase/functions/invia-richiesta`)
- **Deploy**: Vercel (`vercel.json`) oppure Apache/cPanel (`public/.htaccess`)
