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
      manifest: {
        name: 'Clash Royale Coach',
        short_name: 'CR Coach',
        description: 'Conseils de deck et de progression pour Clash Royale',
        theme_color: '#1e293b',
        background_color: '#1e293b',
        display: 'standalone',
        start_url: '/',
        icons: [],
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
  test: {
    environment: 'node',
    include: ['{core,storage,functions}/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [['src/**', 'jsdom']],
  },
})
