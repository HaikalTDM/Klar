import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'Klar - Focus & Task Management',
                short_name: 'Klar',
                description: 'A minimal and beautiful focus timer and task management app.',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            devOptions: {
                enabled: true
            }
        })
    ],

    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'framer-motion']
                }
            }
        }
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api/deepseek': {
                target: 'https://api.deepseek.com/chat/completions',
                changeOrigin: true,
                rewrite: (path) => '',  // Remove the entire path, hitting target directly
                secure: true
            }
        }
    },
    define: {
        // These will be replaced at build time - you'll need to configure these
        __firebase_config: JSON.stringify({
            apiKey: "AIzaSyAdm3OQkrpY0ua9WfDC2hB-JmRWfBg64UQ",
            authDomain: "klar-c5b91.firebaseapp.com",
            projectId: "klar-c5b91",
            storageBucket: "klar-c5b91.firebasestorage.app",
            messagingSenderId: "838832817196",
            appId: "1:838832817196:web:3a8d1f9e62ee93ad237d89",
            measurementId: "G-C8V1R1WG77"
        }),
        __app_id: JSON.stringify("klar-app"),
        __initial_auth_token: JSON.stringify("")
    }
})
