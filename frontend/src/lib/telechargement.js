// Déclenche le téléchargement classique d'un Blob (fallback quand l'API
// Web Share n'est pas disponible, ou pour les exports CSV qui n'ont pas
// vocation à être partagés).
export function telechargerBlob(blob, nomFichier) {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}
