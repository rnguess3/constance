// Écran "Tendances" : visualisation neutre des mesures sur une période
// (7 ou 30 jours) — un graphique tension et un graphique glycémie, chacun
// précédé d'un résumé (moyenne / plus haute / plus basse). Aucun seuil ni
// alerte médicale ici, volontairement : uniquement de la lecture de
// données, l'interprétation reste au patient/médecin.
import { useEffect, useMemo, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import SelecteurPeriode from '../components/tendances/SelecteurPeriode.jsx';
import ResumeMetriques from '../components/tendances/ResumeMetriques.jsx';
import GraphiqueTension from '../components/tendances/GraphiqueTension.jsx';
import GraphiqueGlycemie from '../components/tendances/GraphiqueGlycemie.jsx';
import EtatVide from '../components/EtatVide.jsx';
import MessageRetour from '../components/MessageRetour.jsx';
import { appelApi, SessionExpireeError } from '../lib/api.js';
import {
  calculerBornesPeriode,
  calculerResumeGlycemie,
  calculerResumeTension,
  preparerSeriesChronologiques,
} from '../lib/statistiques.js';
import { formaterNombreDepuisMgDl, lireUnitePreferee } from '../lib/uniteGlycemie.js';

export default function TendancesPage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [periode, setPeriode] = useState('7');
  // null = chargement en cours ; tableau = chargé (vide ou non)
  const [mesures, setMesures] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;

    async function charger() {
      setMesures(null);
      setErreur('');
      try {
        const token = await getToken();
        const { from, to } = calculerBornesPeriode(periode);
        const chemin = `/mesures?from=${from.toISOString()}&to=${to.toISOString()}`;
        const donnees = await appelApi(chemin, { token });
        if (!annule) setMesures(donnees);
      } catch (err) {
        if (err instanceof SessionExpireeError) {
          await signOut();
          navigate('/connexion', { replace: true });
          return;
        }
        if (!annule) setErreur(err.message || 'Impossible de charger les tendances.');
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, [periode, getToken, navigate, signOut]);

  const mesuresTension = useMemo(
    () => preparerSeriesChronologiques((mesures ?? []).filter((m) => m.type === 'tension')),
    [mesures],
  );
  const mesuresGlycemie = useMemo(
    () => preparerSeriesChronologiques((mesures ?? []).filter((m) => m.type === 'glycemie')),
    [mesures],
  );

  const resumeTension = useMemo(() => calculerResumeTension(mesuresTension), [mesuresTension]);
  const resumeGlycemie = useMemo(() => calculerResumeGlycemie(mesuresGlycemie), [mesuresGlycemie]);
  const uniteGlycemie = lireUnitePreferee();

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <h1 className="text-center font-display text-3xl font-semibold text-teal">Tendances</h1>

        <SelecteurPeriode valeur={periode} onChange={setPeriode} />

        <MessageRetour statut={erreur ? 'erreur' : null} texte={erreur} />

        {mesures === null && !erreur && (
          <p className="py-10 text-center font-sans text-sm text-neutral-500">Chargement…</p>
        )}

        {mesures !== null && mesures.length === 0 && (
          <EtatVide
            titre="Pas encore de tendance à afficher"
            description="Enregistre quelques mesures sur cette période pour voir apparaître un graphique."
            texteBouton="Ajouter une mesure"
            lienBouton="/"
          />
        )}

        {mesures !== null && mesures.length > 0 && mesuresTension.length === 0 && (
          <p className="px-1 font-sans text-sm text-neutral-500">Aucune mesure de tension sur cette période.</p>
        )}

        {resumeTension && (
          <section className="flex flex-col gap-2">
            <h2 className="px-1 font-sans text-sm font-medium text-neutral-500">Tension</h2>
            <ResumeMetriques
              couleur="text-teal"
              items={[
                {
                  label: 'Moyenne',
                  valeur: `${resumeTension.moyenne.systolique}/${resumeTension.moyenne.diastolique}`,
                  unite: 'mmHg',
                },
                {
                  label: 'Plus haute',
                  valeur: `${resumeTension.plusHaute.systolique}/${resumeTension.plusHaute.diastolique}`,
                  unite: 'mmHg',
                },
                {
                  label: 'Plus basse',
                  valeur: `${resumeTension.plusBasse.systolique}/${resumeTension.plusBasse.diastolique}`,
                  unite: 'mmHg',
                },
              ]}
            />
            <GraphiqueTension donnees={mesuresTension} />
          </section>
        )}

        {mesures !== null && mesures.length > 0 && mesuresGlycemie.length === 0 && (
          <p className="px-1 font-sans text-sm text-neutral-500">Aucune mesure de glycémie sur cette période.</p>
        )}

        {resumeGlycemie && (
          <section className="flex flex-col gap-2">
            <h2 className="px-1 font-sans text-sm font-medium text-neutral-500">Glycémie</h2>
            <ResumeMetriques
              couleur="text-corail"
              items={[
                { label: 'Moyenne', valeur: formaterNombreDepuisMgDl(resumeGlycemie.moyenne, uniteGlycemie), unite: uniteGlycemie },
                { label: 'Plus haute', valeur: formaterNombreDepuisMgDl(resumeGlycemie.plusHaute, uniteGlycemie), unite: uniteGlycemie },
                { label: 'Plus basse', valeur: formaterNombreDepuisMgDl(resumeGlycemie.plusBasse, uniteGlycemie), unite: uniteGlycemie },
              ]}
            />
            <GraphiqueGlycemie donnees={mesuresGlycemie} unite={uniteGlycemie} />
          </section>
        )}
      </div>
    </main>
  );
}
