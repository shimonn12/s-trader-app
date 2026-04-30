import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    base: './', // שימוש בנתיב יחסי מאפשר גמישות בגיטהאב
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,png,webmanifest}'],
            },
            includeAssets: ['icon.png', 'logo_new.png'],
            manifest: {
                name: 'יומן מסחר',
                short_name: 'יומן מסחר',
                description: 'יומן מסחר למניות וחוזים עתידיים',
                theme_color: '#0b1527',
                background_color: '#0b1527',
                display: 'standalone',
                orientation: 'portrait',
                scope: './',
                start_url: './',
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
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ],
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    }
})
