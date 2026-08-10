// Petites fonctions autour de l'API Push du navigateur (abonnement /
// désabonnement) — la logique de PERMISSION (quand demander, quoi
// afficher avant) reste dans ReglagesPage.jsx, ce fichier ne fait que le
// câblage technique avec le service worker et le backend.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function pushEstDisponible() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// L'API PushManager attend la clé serveur sous forme de Uint8Array, alors
// que web-push la fournit en base64url — conversion standard, pas de
// dépendance dédiée pour ça.
function urlBase64VersUint8Array(base64Url) {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const chaineBrute = atob(base64);
  return Uint8Array.from([...chaineBrute].map((car) => car.charCodeAt(0)));
}

export async function obtenirAbonnementActuel() {
  if (!pushEstDisponible()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

// Crée (ou récupère si déjà existant) l'abonnement push de cet appareil.
// Suppose que la permission de notification est déjà accordée — c'est à
// l'appelant de gérer Notification.requestPermission() en amont.
export async function creerAbonnement() {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VITE_VAPID_PUBLIC_KEY manquante côté frontend (voir frontend/.env.example).');
  }
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64VersUint8Array(VAPID_PUBLIC_KEY),
  });
}

export async function supprimerAbonnementLocal(abonnement) {
  await abonnement.unsubscribe();
}
