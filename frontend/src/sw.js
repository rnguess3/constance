// Service worker de Constance : mise en cache hors-ligne (Workbox, via
// precacheAndRoute) + réception des notifications push pour les rappels
// quotidiens. Compilé par vite-plugin-pwa (stratégie injectManifest, voir
// vite.config.js) — self.__WB_MANIFEST est remplacé au build par la
// liste des ressources à précacher.
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

precacheAndRoute(self.__WB_MANIFEST);

// Constance est une SPA (React Router, BrowserRouter) : seule "index.html"
// est précachée, pas une page par route. Sans cette route de secours,
// recharger l'app hors-ligne sur /historique, /tendances, etc. échouerait
// (rien en cache à cette URL précise) au lieu de servir le shell React qui
// se charge ensuite de router côté client. On exclut les appels à l'API
// backend (déjà gérés séparément par la file d'attente hors-ligne, voir
// lib/mesuresHorsLigne.js) : ce ne sont pas des navigations de toute façon.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Le corps du push est le JSON envoyé par le backend (voir
// backend/src/lib/planificateurRappels.js) : { titre, corps }.
self.addEventListener('push', (event) => {
  let donnees = { titre: 'Constance', corps: 'Il est temps de faire ta prise.' };
  try {
    if (event.data) donnees = event.data.json();
  } catch {
    // Payload non-JSON ou vide : on garde le texte par défaut plutôt que
    // de faire échouer l'affichage de la notification.
  }

  event.waitUntil(
    self.registration.showNotification(donnees.titre, {
      body: donnees.corps,
      tag: 'constance-rappel',
      // Un nouveau rappel remplace le précédent au lieu de s'empiler si
      // l'utilisateur n'a pas encore consulté le premier.
      renotify: true,
    }),
  );
});

// Au clic sur la notification : ramène au premier plan un onglet déjà
// ouvert de l'app s'il y en a un, sinon en ouvre un nouveau.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenetres) => {
      const fenetreExistante = fenetres.find((f) => 'focus' in f);
      if (fenetreExistante) return fenetreExistante.focus();
      return self.clients.openWindow('/');
    }),
  );
});
