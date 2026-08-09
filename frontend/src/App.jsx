// Composant racine temporaire : sert juste à vérifier que Tailwind,
// les couleurs et les polices custom fonctionnent bien.
export default function App() {
  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-display text-4xl font-semibold text-teal">
        Constance
      </h1>
      <p className="font-sans text-neutral-700">
        Suivi quotidien de tension artérielle et de glycémie
      </p>
      <p className="font-mono text-corail text-2xl">128 / 82</p>
    </main>
  );
}
