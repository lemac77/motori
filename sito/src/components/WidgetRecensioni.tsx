import { useEffect, useRef } from 'react';
import { cliente } from '@cliente/cliente.config';

const { featurableId, trustindexId } = cliente.integrazioni;

/** true se il cliente ha un widget recensioni vero configurato */
export const widgetRecensioniAttivo = Boolean(featurableId || trustindexId);

/**
 * Widget recensioni Google del cliente: Featurable oppure Trustindex, in base
 * a quale ID è compilato in config/cliente.config.ts. Se nessuno dei due è
 * presente non renderizza nulla.
 */
export default function WidgetRecensioni() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (featurableId) {
      if (document.querySelector('script[src*="cdn.featurable.com"]')) return;
      const script = document.createElement('script');
      script.src = 'https://cdn.featurable.com/widget/v2/embed.js';
      script.defer = true;
      script.charset = 'UTF-8';
      document.body.appendChild(script);
    } else if (trustindexId) {
      // Trustindex disegna il widget subito dopo il proprio <script>, quindi va dentro al contenitore
      if (el.querySelector('script')) return;
      const script = document.createElement('script');
      script.src = `https://cdn.trustindex.io/loader.js?${trustindexId}`;
      script.defer = true;
      script.async = true;
      el.appendChild(script);
    }
  }, []);

  if (featurableId) {
    return <div ref={containerRef} id={`featurable-${featurableId}`} data-featurable-async className="min-h-[200px]" />;
  }
  if (trustindexId) {
    return <div ref={containerRef} className="min-h-[200px]" />;
  }
  return null;
}
