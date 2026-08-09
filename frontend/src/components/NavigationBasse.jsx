// Barre de navigation basse à 3 items, fixe en bas d'écran (usage
// mobile-first). `nombreEnAttente` affiche un petit badge sur "Saisir"
// quand des mesures attendent encore d'être synchronisées.
import { NavLink } from 'react-router-dom';

const ONGLETS = [
  {
    chemin: '/',
    label: 'Saisir',
    icone: (
      <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />
    ),
  },
  {
    chemin: '/tendances',
    label: 'Tendances',
    icone: <path d="M4 19V10m6 9V5m6 14v-7m6 7V8" />,
  },
  {
    chemin: '/export',
    label: 'Export',
    icone: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />,
  },
];

export default function NavigationBasse({ nombreEnAttente = 0 }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-sm justify-around">
        {ONGLETS.map((onglet) => (
          <NavLink
            key={onglet.chemin}
            to={onglet.chemin}
            end={onglet.chemin === '/'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 font-sans text-xs ${
                isActive ? 'text-teal' : 'text-neutral-400'
              }`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              {onglet.icone}
            </svg>
            {onglet.label}
            {onglet.chemin === '/' && nombreEnAttente > 0 && (
              <span className="absolute right-1/4 top-1 h-4 min-w-4 rounded-full bg-corail px-1 text-[10px] font-medium leading-4 text-white">
                {nombreEnAttente}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
