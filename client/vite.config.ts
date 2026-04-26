import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const appName = isProd ? 'Vinkjelleren' : 'Vinkjelleren (Dev)'
  const shortName = isProd ? 'Vinkjelleren' : 'Vinkjelleren Dev'

  return {
    plugins: [
      tailwindcss(),
      react(),
      basicSsl(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: appName,
          short_name: shortName,
          description: 'Track your wine cellar, scan labels, and get food pairing recommendations.',
          theme_color: '#722F37',
          background_color: '#faf7f4',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        },
        workbox: {
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxAgeSeconds: 3600 }
              }
            }
          ]
        }
      })
    ],
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __APP_NAME__: JSON.stringify(appName),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  }
})
