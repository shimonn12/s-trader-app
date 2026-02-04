import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    base: '/s-trader-app/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,png,webmanifest}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            },
            includeAssets: ['logo_new.png', 'icon.png', 'vite.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'יומן מסחר',
                short_name: 'יומן מסחר',
                description: 'Trading journal and analytics for stocks and futures',
                theme_color: '#0b1527',
                background_color: '#0b1527',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/s-trader-app/',
                start_url: '/s-trader-app/',
                icons: [
                    {
                        src: 'icon.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icon.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        sourcemap: false
    }
})
