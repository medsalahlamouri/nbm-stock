import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Configuration de Vite : React, Tailwind CSS 4 et alias « @ » → src/
// (l'alias est aussi déclaré dans jsconfig.json pour VS Code et shadcn/ui).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Bibliothèques regroupées par famille : le navigateur les garde en cache d'une version à l'autre
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'graphiques', test: /node_modules[\\/](recharts|d3-[a-z]+|victory-vendor|es-toolkit|immer|redux|@reduxjs|reselect)[\\/]/ },
            // Exports chargés seulement au clic : PDF et Excel séparés
            { name: 'export-excel', test: /node_modules[\\/]exceljs[\\/]/ },
            { name: 'export-pdf', test: /node_modules[\\/](jspdf|jspdf-autotable|html2canvas|canvg|core-js|dompurify|fflate)[\\/]/ },
            { name: 'interface', test: /node_modules[\\/](radix-ui|@radix-ui|cmdk|sonner|lucide-react|tailwind-merge|clsx|class-variance-authority)[\\/]/ },
            { name: 'outils', test: /node_modules[\\/](@tanstack|date-fns|zod|react-hook-form|@hookform)[\\/]/ },
          ],
        },
      },
    },
    // exceljs (≈ 950 kB) n'est téléchargé qu'à l'export Excel : seuil d'alerte relevé en conséquence
    chunkSizeWarningLimit: 1000,
  },
})
