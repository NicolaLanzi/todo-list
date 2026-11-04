import { defineConfig } from 'vite'

// Porta fissa: localStorage è legato all'origine (protocollo + host + porta).
// Usando sempre 5173 sia in sviluppo sia in preview, i dati restano disponibili.
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
})
