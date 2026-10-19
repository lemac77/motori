import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { clientePlugin } from '../config/vite-plugin-cliente';
import { faqData } from './src/data';

// Pagine statiche per la sitemap (gli annunci vengono aggiunti da Supabase al build)
const pagine = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/parco-auto', priority: '0.9', changefreq: 'daily' },
  { path: '/azienda', priority: '0.7', changefreq: 'monthly' },
  { path: '/usato-garantito', priority: '0.7', changefreq: 'monthly' },
  { path: '/garanzia', priority: '0.6', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/contatti', priority: '0.6', changefreq: 'monthly' },
];

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), clientePlugin({ faq: faqData, pagine })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@cliente': path.resolve(__dirname, '../config'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            motion: ['motion'],
          },
        },
      },
    },
    server: {
      fs: { allow: ['..'] },
    },
  };
});
