// Écran "Export" : génère un PDF présentable (résumé + graphiques +
// tableau détaillé, pensé pour être lu ou imprimé par un médecin) et un
// CSV brut (toutes les colonnes, pour retraitement). Les graphiques
// affichés ici sont les mêmes composants que l'écran Tendances — l'aperçu
// à l'écran EST ce qui part dans le PDF (rasterisé depuis son SVG réel),
// pas une reconstruction séparée.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
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
  formatPeriodeLisible,
  preparerSeriesChronologiques,
} from '../lib/statistiques.js';
import { genererDocumentPdf, nomFichierExport } from '../lib/exportPdf.js';
import { construireBlobCsv } from '../lib/exportCsv.js';
import { telechargerBlob } from '../lib/telechargement.js';
import { formaterNombreDepuisMgDl, lireUnitePreferee } from '../lib/uniteGlycemie.js';

export default function ExportPage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const [periode, setPeriode] = useState('7');
  // null = chargement en cours ; tableau = chargé (vide ou non)
  const [mesures, setMesures] = useState(null);
  const [erreur, setErreur] = useState('');
  // 'pdf' | 'partage' | null — désactive les boutons pendant une génération
  const [enCours, setEnCours] = useState(null);

  const refSvgTension = useRef(null);
  const refSvgGlycemie = useRef(null);

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
        if (!annule) setErreur(err.message || 'Impossible de charger les mesures à exporter.');
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

  const nomPatient = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Patient';
  const { from, to } = calculerBornesPeriode(periode);
  const periodeLisible = formatPeriodeLisible(from, to);
  const donneesDisponibles = mesures !== null && mesures.length > 0;

  async function construirePdf() {
    return genererDocumentPdf({
      nomPatient,
      periodeLisible,
      mesures: mesures ?? [],
      resumeTension,
      resumeGlycemie,
      uniteGlycemie,
      svgTension: refSvgTension.current?.querySelector('.recharts-wrapper svg') ?? null,
      svgGlycemie: refSvgGlycemie.current?.querySelector('.recharts-wrapper svg') ?? null,
    });
  }

  async function gererTelechargementPdf() {
    setErreur('');
    setEnCours('pdf');
    try {
      const doc = await construirePdf();
      doc.save(nomFichierExport('pdf', periode));
    } catch (err) {
      setErreur(err.message || 'Impossible de générer le PDF.');
    } finally {
      setEnCours(null);
    }
  }

  async function gererPartage() {
    setErreur('');
    setEnCours('partage');
    try {
      const doc = await construirePdf();
      const nomFichier = nomFichierExport('pdf', periode);
      const fichier = new File([doc.output('blob')], nomFichier, { type: 'application/pdf' });

      // Partage natif si le navigateur le permet pour ce fichier (surtout
      // mobile) ; sinon retour au téléchargement classique du même PDF.
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: 'Export Constance', text: `Mesures — ${periodeLisible}` });
      } else {
        doc.save(nomFichier);
      }
    } catch (err) {
      // L'utilisateur qui ferme la feuille de partage déclenche une
      // AbortError : ce n'est pas un échec à signaler.
      if (err.name !== 'AbortError') {
        setErreur(err.message || 'Impossible de partager le PDF.');
      }
    } finally {
      setEnCours(null);
    }
  }

  function gererTelechargementCsv() {
    telechargerBlob(construireBlobCsv(mesures ?? []), nomFichierExport('csv', periode));
  }

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <h1 className="text-center font-display text-3xl font-semibold text-teal">Export</h1>

        <SelecteurPeriode valeur={periode} onChange={setPeriode} />

        <MessageRetour statut={erreur ? 'erreur' : null} texte={erreur} />

        {mesures === null && !erreur && (
          <p className="py-10 text-center font-sans text-sm text-neutral-500">Chargement…</p>
        )}

        {mesures !== null && mesures.length === 0 && (
          <EtatVide
            titre="Rien à exporter pour l’instant"
            description="Enregistre quelques mesures sur cette période pour générer un export."
            texteBouton="Ajouter une mesure"
            lienBouton="/"
          />
        )}

        {donneesDisponibles && (
          <>
            <div className="flex flex-col gap-1 rounded-xl bg-white px-4 py-3 shadow-sm">
              <p className="font-sans text-sm font-medium text-neutral-700">{nomPatient}</p>
              <p className="font-sans text-xs text-neutral-500">{periodeLisible}</p>
            </div>

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
                <div ref={refSvgTension}>
                  <GraphiqueTension donnees={mesuresTension} />
                </div>
              </section>
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
                <div ref={refSvgGlycemie}>
                  <GraphiqueGlycemie donnees={mesuresGlycemie} unite={uniteGlycemie} />
                </div>
              </section>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={gererTelechargementPdf}
                disabled={enCours !== null}
                className="rounded-lg bg-teal px-4 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:opacity-50"
              >
                {enCours === 'pdf' ? 'Génération du PDF…' : 'Télécharger le PDF'}
              </button>
              <button
                type="button"
                onClick={gererPartage}
                disabled={enCours !== null}
                className="rounded-lg border border-teal px-4 py-3 font-sans text-sm font-medium text-teal transition-colors hover:bg-teal/5 disabled:opacity-50"
              >
                {enCours === 'partage' ? 'Préparation…' : 'Partager le PDF'}
              </button>
              <button
                type="button"
                onClick={gererTelechargementCsv}
                disabled={enCours !== null}
                className="rounded-lg px-4 py-2 font-sans text-xs font-medium text-neutral-500 underline disabled:opacity-50"
              >
                Télécharger le CSV brut
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
