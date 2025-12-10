import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
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
