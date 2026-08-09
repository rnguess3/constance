/** @type {import('tailwindcss').Config} */
export default {
  // Fichiers dans lesquels Tailwind va chercher les classes utilisées,
  // pour ne garder dans le CSS final que ce qui sert vraiment.
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Fond papier chaud utilisé comme arrière-plan principal de l'app
        paper: '#F7F2E9',
        // Accent principal (validation, données tension "normales", etc.)
        teal: '#1D9E75',
        // Accent secondaire (alertes douces, mise en avant glycémie, etc.)
        corail: '#D85A30',
      },
      fontFamily: {
        // Titres
        display: ['Fraunces', 'serif'],
        // Corps de texte
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        // Valeurs chiffrées (tension, glycémie...)
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
