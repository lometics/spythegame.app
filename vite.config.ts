import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: { plugins: [tailwindcss, autoprefixer] },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Spy — The Party Word Game',
        short_name: 'Spy',
        description:
          'Party word game: everyone gets a word, the spy gets a different one. Play on one phone or in an online room.',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['games', 'entertainment'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Static pages (how-to-play, the per-language pages from scripts/gen-seo.mjs)
        // must not be swallowed by the SPA fallback.
        navigateFallbackDenylist: [
          /^\/how-to-play/,
          /^\/(en|de|fr|it|es|pt|nl|pl|sv|tr|ru|ar|ja|ko|zh)(\/|$)/,
          /^\/robots\.txt/,
          /^\/sitemap\.xml/,
          /^\/api\//,
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    port: 4321,
    strictPort: true,
  },
})
