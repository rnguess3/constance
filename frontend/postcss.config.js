// PostCSS transforme le CSS : ici il exécute Tailwind (génère les classes
// utilitaires) puis Autoprefixer (ajoute les préfixes -webkit-, -moz-...
// pour la compatibilité navigateurs).
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
