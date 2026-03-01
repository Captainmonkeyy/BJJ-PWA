import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/BJJ-PWA/', // GitHub Pages 子路径，必须与仓库名一致
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'BJJ 训练日志',
        short_name: 'BJJ日志',
        description: '记录每一次柔术训练的进步',
        lang: 'zh-CN',
        theme_color: '#1a365d',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/BJJ-PWA/',
        start_url: '/BJJ-PWA/',
        icons: [
          { src: '/BJJ-PWA/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/BJJ-PWA/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
})
