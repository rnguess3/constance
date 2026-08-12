import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ConnexionPage from './pages/ConnexionPage.jsx';
import SaisirMesurePage from './pages/SaisirMesurePage.jsx';
import HistoriquePage from './pages/HistoriquePage.jsx';
import TendancesPage from './pages/TendancesPage.jsx';
import ReglagesPage from './pages/ReglagesPage.jsx';
import RouteProtegee from './components/RouteProtegee.jsx';
import MiseEnPagePrincipale from './components/MiseEnPagePrincipale.jsx';

// Chargée à la demande : jsPDF/jspdf-autotable/html2canvas (~250 Ko) ne
// servent qu'à cet écran, inutile de les inclure dans le bundle initial
// (Saisir/Historique) chargé à chaque ouverture de l'app.
const ExportPage = lazy(() => import('./pages/ExportPage.jsx'));

function ChargementPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 pb-24">
      <p className="font-sans text-sm text-neutral-500">Chargement…</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<ConnexionPage />} />
      <Route
        element={
          <RouteProtegee>
            <MiseEnPagePrincipale />
          </RouteProtegee>
        }
      >
        <Route path="/" element={<SaisirMesurePage />} />
        <Route path="/mesures/:id/modifier" element={<SaisirMesurePage />} />
        <Route path="/historique" element={<HistoriquePage />} />
        <Route path="/tendances" element={<TendancesPage />} />
        <Route
          path="/export"
          element={
            <Suspense fallback={<ChargementPage />}>
              <ExportPage />
            </Suspense>
          }
        />
        <Route path="/reglages" element={<ReglagesPage />} />
      </Route>
    </Routes>
  );
}
