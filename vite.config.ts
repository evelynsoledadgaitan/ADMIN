import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Ver docs/decisiones/0004-pwa-sin-offline.md para el porqué de esta configuración.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // se actualiza solo, sin pedirle nada al usuario
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'ADMIN',
        short_name: 'ADMIN',
        description: 'Administración de negocio — ahorrar tiempo y no olvidar nada.',
        theme_color: '#101828',
        background_color: '#101828',
        display: 'standalone', // pantalla completa, sin barra del navegador
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Intencional: SIN cache de datos ni fallback offline.
        // Solo precacheamos el shell de la app (JS/CSS/HTML) para que abra rápido e instale bien.
        // Cualquier llamada a Supabase va siempre a la red.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: null,
        runtimeCaching: []
      },
      devOptions: { enabled: false }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  }
})
