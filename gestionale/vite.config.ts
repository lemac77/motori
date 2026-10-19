import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { clientePlugin } from '../config/vite-plugin-cliente'

export default defineConfig({
  plugins: [react(), tailwindcss(), clientePlugin()],
  resolve: {
    alias: {
      '@cliente': path.resolve(__dirname, '../config'),
    },
  },
  server: {
    fs: { allow: ['..'] },
  },
})
