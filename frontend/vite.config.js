import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Config Vite : plugin React (JSX, fast refresh) + plugin PWA
// (génère le manifest et le service worker pour l'installation hors-ligne).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Constance',
        short_name: 'Constance',
        description: 'Suivi quotidien de tension artérielle et de glycémie',
        theme_color: '#F7F2E9',
        background_color: '#F7F2E9',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
});
