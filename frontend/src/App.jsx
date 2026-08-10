import { Routes, Route } from 'react-router-dom';
import ConnexionPage from './pages/ConnexionPage.jsx';
import SaisirMesurePage from './pages/SaisirMesurePage.jsx';
import HistoriquePage from './pages/HistoriquePage.jsx';
import TendancesPage from './pages/TendancesPage.jsx';
import ExportPage from './pages/ExportPage.jsx';
import ReglagesPage from './pages/ReglagesPage.jsx';
import RouteProtegee from './components/RouteProtegee.jsx';
import MiseEnPagePrincipale from './components/MiseEnPagePrincipale.jsx';

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
        <Route path="/export" element={<ExportPage />} />
        <Route path="/reglages" element={<ReglagesPage />} />
      </Route>
    </Routes>
  );
}
