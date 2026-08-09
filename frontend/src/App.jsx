import { Routes, Route } from 'react-router-dom';
import ConnexionPage from './pages/ConnexionPage.jsx';
import SaisirMesurePage from './pages/SaisirMesurePage.jsx';
import TendancesPage from './pages/TendancesPage.jsx';
import ExportPage from './pages/ExportPage.jsx';
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
        <Route path="/tendances" element={<TendancesPage />} />
        <Route path="/export" element={<ExportPage />} />
      </Route>
    </Routes>
  );
}
