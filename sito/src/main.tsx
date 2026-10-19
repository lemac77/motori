import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { leggiConsenso, caricaTracking } from './lib/tracking';

// Consenso già dato in una visita precedente: carica subito GA4/GTM
if (leggiConsenso() === 'accepted') caricaTracking();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);