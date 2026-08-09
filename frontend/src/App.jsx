import { Routes, Route } from 'react-router-dom';
import ConnexionPage from './pages/ConnexionPage.jsx';
import TableauDeBordPage from './pages/TableauDeBordPage.jsx';
import RouteProtegee from './components/RouteProtegee.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<ConnexionPage />} />
      <Route
        path="/"
        element={
          <RouteProtegee>
            <TableauDeBordPage />
          </RouteProtegee>
        }
      />
    </Routes>
  );
}
