import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Config Vite : plugin React (JSX, fast refresh) + plugin PWA
// (génère le manifest et le service worker pour l'installation hors-ligne).
//
// Stratégie "injectManifest" (plutôt que "generateSW" utilisé avant) :
// generateSW fait générer le service worker entièrement par Workbox, sans
// possibilité d'y ajouter du code custom. Les rappels ont besoin d'un
// gestionnaire d'événement "push" (réception d'une notification) et
// "notificationclick" (ouverture de l'app au clic) — du code qu'on
// écrit nous-mêmes dans src/sw.js. injectManifest précompile CE fichier
// et y injecte juste la liste des ressources à mettre en cache
// (self.__WB_MANIFEST), en laissant le reste du fichier intact.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // Évite d'embarquer les gros bundles PDF (jsPDF/autotable) dans le
        // précache du service worker : ils ne servent qu'à l'écran Export,
        // chargés à la demande, pas nécessaires pour l'usage hors-ligne.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      // Par défaut, vite-plugin-pwa n'active PAS de service worker sous
      // `npm run dev` (seulement au build). Sans ça, impossible de tester
      // les rappels autrement qu'avec un `npm run build && npm run preview`
      // à chaque changement — on l'active donc aussi en dev.
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Constance',
        short_name: 'Constance',
        description: 'Suivi quotidien de tension artérielle et de glycémie',
        lang: 'fr',
        // theme_color : couleur de la barre d'adresse/barre de statut une
        // fois l'app installée (teal, couleur de marque) — différente de
        // background_color, qui est juste l'écran de démarrage (paper),
        // affiché une fraction de seconde avant que React ne prenne le relai.
        theme_color: '#1D9E75',
        background_color: '#F7F2E9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
