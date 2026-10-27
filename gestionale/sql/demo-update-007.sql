-- =====================================================================
-- AGGIORNAMENTO DEMO (per chi ha già eseguito il primo demo-setup.sql)
-- Aggiunge: commerciali, dati di vendita, CRM richieste, promemoria scadenze
-- e ricarica i dati demo (12 mesi di vendite). Sicuro da rieseguire.
-- Supabase > SQL Editor > New query > incolla tutto > Run
-- =====================================================================
-- =====================================================
-- GESTIONALE AUTOSALONE - Migrazione: commerciali, dati di vendita,
-- stato richieste (mini CRM). Additiva: si può lanciare su un DB esistente.
-- =====================================================

-- Commerciali / utenti del salone
create table if not exists commerciali (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text,
  -- se coincide con l'email di login, il gestionale applica il ruolo a quell'utente
  email text,
  ruolo text not null default 'commerciale' check (ruolo in ('titolare', 'commerciale')),
  attivo boolean not null default true,
  creato_il timestamptz not null default now()
);

alter table commerciali enable row level security;
drop policy if exists "Autenticati gestiscono commerciali" on commerciali;
create policy "Autenticati gestiscono commerciali"
  on commerciali for all to authenticated using (true) with check (true);

-- Dati di vendita sull'annuncio
alter table annunci
  add column if not exists venduto_il date,
  add column if not exists prezzo_acquisto numeric(10,2),
  add column if not exists costi_ripristino numeric(10,2),
  add column if not exists commerciale_id uuid references commerciali(id) on delete set null,
  add column if not exists canale_vendita text;

create index if not exists idx_annunci_venduto_il on annunci(venduto_il);
create index if not exists idx_annunci_commerciale on annunci(commerciale_id);

-- Richieste dal sito: stato, assegnazione, note
alter table richieste_sito
  add column if not exists stato text not null default 'nuova',
  add column if not exists commerciale_id uuid references commerciali(id) on delete set null,
  add column if not exists note text,
  add column if not exists aggiornato_il timestamptz;

do $$ begin
  alter table richieste_sito add constraint richieste_sito_stato_check
    check (stato in ('nuova', 'contattato', 'test_drive', 'trattativa', 'venduto', 'perso'));
exception when duplicate_object then null;
end $$;

-- Promemoria già gestiti (pagina Scadenze): revisione, bollo, garanzia, tagliando
create table if not exists promemoria_fatti (
  id uuid primary key default gen_random_uuid(),
  annuncio_id uuid not null references annunci(id) on delete cascade,
  tipo text not null check (tipo in ('revisione', 'bollo', 'garanzia', 'tagliando')),
  fatto_il timestamptz not null default now(),
  unique (annuncio_id, tipo)
);
alter table promemoria_fatti enable row level security;
drop policy if exists "Autenticati gestiscono promemoria" on promemoria_fatti;
create policy "Autenticati gestiscono promemoria"
  on promemoria_fatti for all to authenticated using (true) with check (true);

-- =====================================================================
-- DEMO Autosalone Test: funzione reset_demo()
-- Riporta il database allo stato iniziale della demo:
--  - 4 utenti (titolare + 3 commerciali)
--  - 8 auto in stock (con foto statiche in /brand/auto-demo/)
--  - ~90 auto vendute negli ultimi 12 mesi (per le analitiche)
--  - richieste dal sito in vari stati (mini CRM)
--  - scadenze vicine (revisione, bollo, garanzie, tagliandi)
-- Tutte le date sono relative a oggi, quindi la demo resta sempre "fresca".
-- Chiamata ogni notte da pg_cron ('reset-demo').
-- =====================================================================
create or replace function reset_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- catalogo usato per le vendite storiche: marca, modello, alimentazione, carrozzeria, prezzo base
  cat text[][] := array[
    ['Fiat','Panda','Ibrida','City car','11900'],
    ['Fiat','500','Ibrida','City car','13500'],
    ['Fiat','Tipo','Benzina','Berlina','14900'],
    ['Volkswagen','Polo','Benzina','City car','15900'],
    ['Volkswagen','Golf','Diesel','Berlina','22900'],
    ['Volkswagen','T-Roc','Benzina','SUV','24900'],
    ['Toyota','Yaris','Ibrida','City car','16900'],
    ['Toyota','C-HR','Ibrida','SUV','24500'],
    ['Renault','Clio','GPL','City car','13900'],
    ['Renault','Captur','GPL','SUV','18500'],
    ['Dacia','Sandero','GPL','City car','11500'],
    ['Dacia','Duster','GPL','SUV','16900'],
    ['Peugeot','208','Benzina','City car','15500'],
    ['Peugeot','3008','Diesel','SUV','23900'],
    ['Jeep','Renegade','Diesel','SUV','19900'],
    ['Jeep','Compass','Ibrida','SUV','27500'],
    ['Audi','A3','Diesel','Berlina','25900'],
    ['Audi','Q3','Diesel','SUV','32900'],
    ['BMW','Serie 1','Diesel','Berlina','24900'],
    ['BMW','X1','Diesel','SUV','31900'],
    ['Mercedes-Benz','Classe A','Diesel','Berlina','27900'],
    ['Ford','Puma','Ibrida','SUV','20900'],
    ['Kia','Sportage','Ibrida','SUV','26900'],
    ['Tesla','Model 3','Elettrica','Berlina','33900']
  ];
  -- peso di ogni modello (quante "estrazioni" su 100): Panda, Yaris e Clio vanno forte, Tesla e Q3 poco
  pesi int[] := array[9,6,3,5,6,5,8,4,7,5,6,5,4,3,4,3,3,1,3,1,2,4,2,1];
  -- province clienti (Veneto)
  prov text[] := array['VI','VI','VI','VI','VI','VI','VI','VI','VI','PD','PD','PD','PD','VR','VR','VR','TV','TV','VE','RO'];
  citta_vi text[] := array['Vicenza','Bassano del Grappa','Schio','Thiene','Arzignano','Valdagno','Montecchio Maggiore','Lonigo','Noventa Vicentina'];
  citta jsonb := '{"PD":["Padova","Cittadella","Este"],"VR":["Verona","San Bonifacio","Legnago"],"TV":["Treviso","Castelfranco Veneto"],"VE":["Mestre","Noale"],"RO":["Rovigo","Badia Polesine"]}';
  canali text[] := array['Sito web','Sito web','Sito web','Sito web','Sito web','Sito web','Sito web','AutoScout24','AutoScout24','AutoScout24','AutoScout24','AutoScout24','Passaparola','Passaparola','Passaparola','In salone','In salone','In salone','Subito.it','Subito.it'];
  nomi text[] := array['Marco','Giulia','Luca','Francesca','Andrea','Sara','Matteo','Elena','Davide','Chiara','Alessandro','Martina','Stefano','Valentina','Paolo','Federica','Simone','Laura','Nicola','Anna'];
  cognomi text[] := array['Dalla Valle','Zanella','Bortolan','Cracco','Rigon','Pellizzari','Tonin','Zordan','Fabris','Battistella','Carollo','Dal Santo','Sartori','Marchetto','Pozza','Visentin','Bertoldo','Cavedon','Lovato','Piccoli'];
  -- commerciali (id fissi): Marco Rigon chiude di più, Luca Bertoldo meno
  c_titolare uuid := '00000000-0000-4000-9000-000000000001';
  c_marco uuid := '00000000-0000-4000-9000-000000000002';
  c_giulia uuid := '00000000-0000-4000-9000-000000000003';
  c_luca uuid := '00000000-0000-4000-9000-000000000004';
  i int; k int; acc int; r double precision; idx int; p text; cit text;
  d_vendita date; d_ingresso date; prezzo_v numeric; listino numeric; acquisto numeric; comm uuid;
begin
  perform setseed(0.4242);

  -- ---------- pulizia ----------
  delete from promemoria_fatti;
  delete from documenti_generati;
  delete from richieste_sito;
  delete from annuncio_foto;
  delete from annunci;
  delete from commerciali;
  update impostazioni_generali set
    tasso_finanziamento_tan = 9.95, taeg_con_assicurazione = 13.40, taeg_senza_assicurazione = 12.10,
    spese_istruttoria = 350, spese_incasso_rata = 0, rapporto_assicurazione = 0.2227,
    prossimo_numero_progressivo = 1
  where id = 1;
  begin
    delete from storage.objects where bucket_id in ('annunci-foto', 'documenti');
  exception when others then null;
  end;

  -- ---------- utenti ----------
  insert into commerciali (id, nome, cognome, email, ruolo) values
    (c_titolare, 'Account', 'Demo', 'demo@bericamotori.it', 'titolare'),
    (c_marco, 'Marco', 'Rigon', 'marco.rigon@bericamotori.it', 'commerciale'),
    (c_giulia, 'Giulia', 'Zanon', 'giulia.zanon@bericamotori.it', 'commerciale'),
    (c_luca, 'Luca', 'Bertoldo', 'luca.bertoldo@bericamotori.it', 'commerciale');

  -- ---------- auto in stock (vetrina) ----------
  insert into annunci (id, marca, modello, versione, prezzo, condizione, immatricolazione_mese, immatricolazione_anno, km,
    alimentazione, cambio, colore, carrozzeria, porte, posti, classe_emissioni, cv, cilindrata_cc, descrizione,
    accessori, stato_pubblicazione, targa, numero_proprietari, prezzo_acquisto, costi_ripristino,
    scadenza_revisione, scadenza_bollo, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'Volkswagen', 'Golf', '1.5 eTSI 150 CV EVO ACT DSG Life', 24900, 'Usato', 3, 2022, 34100,
    'Ibrida', 'Automatico', 'Grigio Moonstone', 'Berlina', '5', 5, 'Euro 6d', 150, 1498,
    'Golf ottava serie mild hybrid, unico proprietario, tagliandi ufficiali documentati. Cambio DSG fluido, consumi contenuti e tanta tecnologia di serie.',
    '["Navigatore","Apple CarPlay / Android Auto","Cruise control adattivo","Fari LED","Sensori di parcheggio","Climatizzatore automatico"]',
    'pubblicato', 'GA123BM', 1, 20500, 650, current_date + 18, current_date + 120, now() - interval '12 days'),
  ('00000000-0000-4000-8000-000000000002', 'Jeep', 'Compass', '1.3 T4 PHEV 190 CV 4xe Limited', 27900, 'Usato', 6, 2021, 41200,
    'Ibrida', 'Automatico', 'Bianco Alpine', 'SUV', '5', 5, 'Euro 6d', 190, 1332,
    'Compass plug-in hybrid con trazione integrale elettrica 4xe: in città si va in elettrico, fuori porta si ha tutta la sicurezza di una 4x4.',
    '["Trazione integrale","Navigatore","Telecamera posteriore","Portellone elettrico","Sedili riscaldabili","Cerchi in lega 18 pollici"]',
    'pubblicato', 'GB456BM', 1, 23200, 900, current_date + 200, current_date - 6, now() - interval '34 days'),
  ('00000000-0000-4000-8000-000000000003', 'Fiat', '500e', 'Icon 118 CV 42 kWh', 18900, 'Usato', 9, 2023, 14500,
    'Elettrica', 'Automatico', 'Celestial Blue', 'City car', '3', 4, 'Euro 6d', 118, null,
    'La 500 tutta elettrica, perfetta per la città: fino a 300 km di autonomia, ricarica rapida e zero pensieri per ZTL e parcheggi.',
    '["Ricarica rapida","Navigatore","Apple CarPlay / Android Auto","Sensori di parcheggio","Fari LED"]',
    'pubblicato', 'GE789BM', 1, 15400, 300, current_date + 400, current_date + 60, now() - interval '9 days'),
  ('00000000-0000-4000-8000-000000000004', 'Audi', 'A3 Sportback', '30 TDI S line S tronic', 25900, 'Usato', 4, 2021, 58000,
    'Diesel', 'Automatico', 'Nero Mythos', 'Berlina', '5', 5, 'Euro 6d', 116, 1968,
    'A3 Sportback in allestimento S line, interni sportivi e virtual cockpit. Diesel parco nei consumi, ideale per chi macina chilometri.',
    '["Virtual cockpit","Navigatore","Fari LED","Sedili sportivi","Sensori di parcheggio","Cerchi in lega 18 pollici"]',
    'pubblicato', 'GC321BM', 2, 21900, 1200, current_date + 25, current_date + 90, now() - interval '97 days'),
  ('00000000-0000-4000-8000-000000000005', 'Toyota', 'Yaris Cross', '1.5 Hybrid 116 CV Lounge', 23900, 'Usato', 2, 2023, 18200,
    'Ibrida', 'Automatico', 'Rosso Tokyo', 'SUV', '5', 5, 'Euro 6d', 116, 1490,
    'Il SUV compatto full hybrid più amato: affidabilità Toyota, consumi da utilitaria e garanzia sulla batteria ibrida.',
    '["Head-up display","Navigatore","Telecamera posteriore","Cruise control adattivo","Climatizzatore automatico"]',
    'pubblicato', 'GF654BM', 1, 20100, 400, current_date + 500, current_date + 150, now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000006', 'Peugeot', '2008', 'PureTech 130 S&S Allure Pack', 20500, 'Usato', 5, 2022, 29400,
    'Benzina', 'Manuale', 'Grigio Artense', 'SUV', '5', 5, 'Euro 6d', 130, 1199,
    'SUV compatto dal design deciso, i-Cockpit 3D e ottima abitabilità. Benzina brillante, perfetto per chi percorre pochi km all''anno.',
    '["i-Cockpit 3D","Navigatore","Telecamera posteriore","Sensori di parcheggio","Fari LED"]',
    'pubblicato', 'GD987BM', 1, 17200, 550, current_date - 3, current_date + 40, now() - interval '61 days'),
  ('00000000-0000-4000-8000-000000000007', 'Mercedes-Benz', 'Classe A', 'A 180 d Automatic Sport', 28900, 'Usato', 10, 2021, 52000,
    'Diesel', 'Automatico', 'Argento Iridio', 'Berlina', '5', 5, 'Euro 6d', 116, 1461,
    'Classe A con sistema MBUX e assistente vocale, cambio automatico a doppia frizione e allestimento Sport.',
    '["MBUX con comandi vocali","Navigatore","Fari LED","Telecamera posteriore","Climatizzatore automatico bizona"]',
    'pubblicato', 'GA555BM', 1, 24600, 800, current_date + 300, current_date + 12, now() - interval '128 days'),
  ('00000000-0000-4000-8000-000000000008', 'Alfa Romeo', 'Giulia', '2.2 Turbo Diesel 190 CV AT8 Veloce', 34900, 'Usato', 7, 2022, 43500,
    'Diesel', 'Automatico', 'Rosso Alfa', 'Berlina', '4', 5, 'Euro 6d', 190, 2143,
    'Giulia Veloce, la berlina sportiva italiana per eccellenza. In preparazione: foto e descrizione definitive in arrivo.',
    '["Navigatore","Sedili in pelle","Fari bi-xeno","Cerchi in lega 19 pollici","Palette al volante"]',
    'bozza', 'GB222BM', 1, 29800, 1500, current_date + 220, current_date + 75, now() - interval '3 days');

  insert into annuncio_foto (annuncio_id, url_originale, url_thumbnail, ordine)
  select ('00000000-0000-4000-8000-00000000000' || n)::uuid,
         '/brand/auto-demo/auto-0' || n || '.webp',
         '/brand/auto-demo/auto-0' || n || '.webp', 0
  from generate_series(1, 8) as n;

  -- ---------- storico vendite (ultimi 12 mesi, trend in crescita) ----------
  for i in 1..92 loop
    -- modello pesato
    r := random() * 100; acc := 0; idx := 1;
    for k in 1..array_length(pesi, 1) loop
      acc := acc + pesi[k];
      if r < acc then idx := k; exit; end if;
    end loop;

    -- più vendite recenti che vecchie, mai nel futuro
    d_vendita := current_date - floor(365 * power(random(), 1.35))::int;
    d_ingresso := d_vendita - (8 + floor(random() * 75))::int;
    prezzo_v := round((cat[idx][5]::numeric * (0.85 + random() * 0.3)) / 100) * 100;
    listino := prezzo_v + round(random() * 6) * 100;
    acquisto := round((prezzo_v * (0.76 + random() * 0.1)) / 100) * 100;

    r := random();
    comm := case when r < 0.42 then c_marco when r < 0.77 then c_giulia else c_luca end;

    p := prov[1 + floor(random() * array_length(prov, 1))::int];
    if p = 'VI' then
      cit := citta_vi[1 + floor(random() * array_length(citta_vi, 1))::int];
    else
      cit := citta->p->>(floor(random() * jsonb_array_length(citta->p))::int);
    end if;

    insert into annunci (marca, modello, prezzo, condizione, immatricolazione_anno, km, alimentazione, cambio,
      carrozzeria, stato_pubblicazione, created_at, venduto_il, prezzo_finale_vendita, prezzo_acquisto, costi_ripristino,
      commerciale_id, canale_vendita, cliente_nome, cliente_cognome, cliente_citta, cliente_provincia, cliente_cellulare,
      garanzia_aggiuntiva_mesi, targa)
    values (cat[idx][1], cat[idx][2], listino, 'Usato', extract(year from d_vendita)::int - (1 + floor(random() * 6))::int,
      (5000 + floor(random() * 110000))::int, cat[idx][3],
      case when random() < 0.55 then 'Automatico' else 'Manuale' end,
      cat[idx][4], 'venduto', d_ingresso::timestamptz, d_vendita, prezzo_v, acquisto,
      round((200 + random() * 1300) / 50) * 50,
      comm, canali[1 + floor(random() * array_length(canali, 1))::int],
      nomi[1 + floor(random() * 20)::int], cognomi[1 + floor(random() * 20)::int], cit, p,
      '333 000 ' || lpad(i::text, 4, '0'),
      case when random() < 0.6 then 0 when random() < 0.7 then 12 else 24 end,
      'GX' || lpad(i::text, 3, '0') || 'BM');
  end loop;

  -- un paio di vendite di 11-12 mesi fa, così le scadenze garanzia/tagliando non sono mai vuote
  update annunci set
    venduto_il = current_date - interval '12 months' + (n.k * 6 || ' days')::interval,
    created_at = current_date - interval '13 months' + (n.k * 6 || ' days')::interval,
    garanzia_aggiuntiva_mesi = 0
  from (select id, row_number() over (order by venduto_il) as k from annunci where stato_pubblicazione = 'venduto' limit 4) n
  where annunci.id = n.id;

  -- tre clienti di quasi 2 anni fa con garanzia estesa di 12 mesi in scadenza
  update annunci set
    venduto_il = current_date - interval '24 months' + (n.k * 9 || ' days')::interval,
    created_at = current_date - interval '25 months' + (n.k * 9 || ' days')::interval,
    garanzia_aggiuntiva_mesi = 12
  from (select id, row_number() over (order by venduto_il desc) as k from annunci
        where stato_pubblicazione = 'venduto' and garanzia_aggiuntiva_mesi = 0 order by venduto_il desc limit 3) n
  where annunci.id = n.id;

  -- ---------- richieste dal sito (mini CRM) ----------
  insert into richieste_sito (tipo, nome, email, telefono, dati, stato, commerciale_id, note, creato_il, aggiornato_il) values
    ('test_drive', 'Riccardo Zanin', 'riccardo.zanin@example.com', '333 000 1101', '{"auto":"Volkswagen Golf 1.5 eTSI","dataDesiderata":"sabato mattina","fasciaOraria":"10-12"}', 'nuova', null, null, now() - interval '2 hours', null),
    ('contatto', 'Elisa Moro', 'elisa.moro@example.com', '333 000 1102', '{"auto_interesse":"Fiat 500e","messaggio":"Buongiorno, la 500e è ancora disponibile? Avete formule di finanziamento senza anticipo?","provincia":"VI"}', 'nuova', null, null, now() - interval '5 hours', null),
    ('permuta', 'Gianni Fontana', 'g.fontana@example.com', '333 000 1103', '{"marcaModello":"Opel Corsa 1.2","dataImmatricolazione":"2016","km":"98000","alimentazione":"Benzina","note":"Interessato alla Yaris Cross"}', 'nuova', null, null, now() - interval '1 day', null),
    ('contatto', 'Paola Dal Lago', 'paola.dl@example.com', '333 000 1104', '{"auto_interesse":"Jeep Compass 4xe","messaggio":"Vorrei un preventivo con permuta","provincia":"PD"}', 'contattato', c_giulia, 'Richiamata, passa giovedì con la sua Qashqai', now() - interval '2 days', now() - interval '1 day'),
    ('test_drive', 'Tommaso Berti', 'tommaso.berti@example.com', '333 000 1105', '{"auto":"Audi A3 Sportback 30 TDI","dataDesiderata":"martedì","fasciaOraria":"17-19"}', 'test_drive', c_marco, 'Test drive fissato martedì ore 18', now() - interval '3 days', now() - interval '2 days'),
    ('contatto', 'Silvia Ceccato', 'silvia.ceccato@example.com', '333 000 1106', '{"auto_interesse":"Mercedes Classe A","messaggio":"Si può trattare sul prezzo?","provincia":"VI"}', 'trattativa', c_marco, 'Offerta a 27.900 con garanzia 24 mesi', now() - interval '4 days', now() - interval '1 day'),
    ('permuta', 'Fabio Lazzarin', 'fabio.l@example.com', '333 000 1107', '{"marcaModello":"Renault Clio dCi","dataImmatricolazione":"2015","km":"142000","alimentazione":"Diesel"}', 'contattato', c_luca, 'Valutazione indicativa 3.500 €, deve portarla a vedere', now() - interval '6 days', now() - interval '5 days'),
    ('contatto', 'Monica Grendene', 'monica.g@example.com', '333 000 1108', '{"auto_interesse":"Peugeot 2008","messaggio":"Avete la versione automatica?","provincia":"VR"}', 'perso', c_giulia, 'Ha comprato altrove, cercava automatico', now() - interval '9 days', now() - interval '6 days'),
    ('test_drive', 'Andrea Cogo', 'andrea.cogo@example.com', '333 000 1109', '{"auto":"Toyota Yaris Cross Hybrid","dataDesiderata":"venerdì","fasciaOraria":"15-17"}', 'venduto', c_marco, 'Venduta! Consegna tra 10 giorni', now() - interval '12 days', now() - interval '4 days'),
    ('contatto', 'Laura Brunello', 'laura.brunello@example.com', '333 000 1110', '{"auto_interesse":"Fiat Panda Hybrid","messaggio":"Cerco una Panda per mia figlia neopatentata","provincia":"VI"}', 'trattativa', c_luca, 'Proporre Panda in arrivo a fine mese', now() - interval '14 days', now() - interval '3 days'),
    ('contatto', 'Stefano Peruzzo', 'ste.peruzzo@example.com', '333 000 1111', '{"auto_interesse":"Golf","messaggio":"Fate consegna a Treviso?","provincia":"TV"}', 'venduto', c_giulia, 'Chiusa con consegna a domicilio', now() - interval '18 days', now() - interval '10 days'),
    ('permuta', 'Ivana Rossato', 'ivana.r@example.com', '333 000 1112', '{"marcaModello":"Fiat Punto","dataImmatricolazione":"2012","km":"160000","alimentazione":"GPL"}', 'perso', c_luca, 'Valutazione troppo bassa per lei', now() - interval '21 days', now() - interval '19 days'),
    ('test_drive', 'Nicolò Furlan', 'nicolo.furlan@example.com', '333 000 1113', '{"auto":"Jeep Compass 4xe","dataDesiderata":"sabato","fasciaOraria":"9-11"}', 'venduto', c_marco, null, now() - interval '26 days', now() - interval '15 days'),
    ('contatto', 'Beatrice Sella', 'bea.sella@example.com', '333 000 1114', '{"auto_interesse":"Toyota C-HR","messaggio":"Info su garanzia batteria ibrida","provincia":"PD"}', 'contattato', c_giulia, 'Inviata scheda garanzia via mail', now() - interval '30 days', now() - interval '28 days'),
    ('contatto', 'Diego Pasqualotto', 'diego.p@example.com', '333 000 1115', '{"auto_interesse":"BMW X1","messaggio":"Avete X1 con meno di 60.000 km?","provincia":"VI"}', 'perso', c_marco, 'Nessuna disponibilità', now() - interval '35 days', now() - interval '33 days'),
    ('test_drive', 'Arianna Toffanin', 'arianna.t@example.com', '333 000 1116', '{"auto":"Renault Captur GPL","dataDesiderata":"mercoledì","fasciaOraria":"18-19"}', 'venduto', c_luca, null, now() - interval '41 days', now() - interval '30 days'),
    ('contatto', 'Michele Guerra', 'michele.guerra@example.com', '333 000 1117', '{"auto_interesse":"Dacia Duster GPL","messaggio":"Prezzo finale con passaggio?","provincia":"RO"}', 'venduto', c_giulia, null, now() - interval '47 days', now() - interval '38 days'),
    ('permuta', 'Roberta Pegoraro', 'roberta.p@example.com', '333 000 1118', '{"marcaModello":"VW Polo","dataImmatricolazione":"2017","km":"88000","alimentazione":"Benzina"}', 'venduto', c_marco, 'Permuta + Golf', now() - interval '55 days', now() - interval '44 days');
end;
$$;

select reset_demo();
