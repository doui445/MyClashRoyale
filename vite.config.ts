/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      core: new URL('./core', import.meta.url).pathname,
      storage: new URL('./storage', import.meta.url).pathname,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Icônes générées une fois depuis public/logo.svg (pas de générateur en dépendance)
      includeAssets: ['logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'MyCR',
        short_name: 'MyCR',
        lang: 'fr',
        description: 'Conseils de deck et de progression pour Clash Royale',
        theme_color: '#1e293b',
        background_color: '#1e293b',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/meta-decks.json',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'meta-decks', expiration: { maxEntries: 4 } },
          },
        ],
      },
    }),
  ],
  // @ts-ignore - vitest/config should add 'test' to the config type, but merging may be version-dependent
  test: {
    environment: 'node',
    include: ['{core,storage,functions}/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['src/**', 'jsdom']],
  },
})
