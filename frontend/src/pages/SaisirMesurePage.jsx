// Écran de saisie rapide — sert aussi d'écran d'ÉDITION.
//
// Deux façons d'arriver ici :
//   - route "/" : création d'une nouvelle mesure (id absent)
//   - route "/mesures/:id/modifier" (depuis l'historique) : édition d'une
//     mesure existante, pré-remplie. On réutilise volontairement le même
//     formulaire plutôt que d'en construire un second : les deux cas
//     partagent exactement les mêmes champs et la même validation.
import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import OngletsType from '../components/saisie/OngletsType.jsx';
import NumericField from '../components/saisie/NumericField.jsx';
import ContextChips from '../components/saisie/ContextChips.jsx';
import NoteField from '../components/saisie/NoteField.jsx';
import DateHeureField, { versDatetimeLocal, depuisDatetimeLocal } from '../components/saisie/DateHeureField.jsx';
import BoutonEnregistrer from '../components/saisie/BoutonEnregistrer.jsx';
import MessageRetour from '../components/MessageRetour.jsx';
import SelecteurSegments from '../components/SelecteurSegments.jsx';
import { CONTEXTES_PAR_TYPE, validerMesure, estValide } from '../validation/mesureValidation.js';
import { appelApi, SessionExpireeError } from '../lib/api.js';
import { ajouterMesureEnAttente } from '../lib/mesuresHorsLigne.js';
import {
  UNITES_GLYCEMIE,
  DECIMALES_PAR_UNITE,
  convertirVersMgDl,
  formaterNombreDepuisMgDl,
  lireUnitePreferee,
  ecrireUnitePreferee,
} from '../lib/uniteGlycemie.js';

const OPTIONS_UNITE_GLYCEMIE = UNITES_GLYCEMIE.map((unite) => ({ valeur: unite, label: unite }));

function etatInitial() {
  return {
    type: 'tension',
    valeur1: '',
    valeur2: '',
    pouls: '',
    contexte: '',
    note: '',
    dateHeureTexte: versDatetimeLocal(new Date()),
    uniteGlycemie: lireUnitePreferee(),
  };
}

function etatDepuisMesure(mesure) {
  const uniteGlycemie = lireUnitePreferee();
  return {
    type: mesure.type,
    valeur1:
      mesure.valeur1 == null
        ? ''
        : mesure.type === 'glycemie'
          ? formaterNombreDepuisMgDl(mesure.valeur1, uniteGlycemie)
          : String(mesure.valeur1),
    valeur2: mesure.valeur2 != null ? String(mesure.valeur2) : '',
    pouls: mesure.pouls != null ? String(mesure.pouls) : '',
    contexte: mesure.contexte,
    note: mesure.note ?? '',
    dateHeureTexte: versDatetimeLocal(new Date(mesure.dateHeure)),
    uniteGlycemie,
  };
}

// Construit le corps JSON à envoyer à l'API (ou à mettre en file
// d'attente) à partir de l'état brut du formulaire. Convertit les champs
// texte en nombres/null comme attendu par la validation
// (mesureValidation.js) et par l'API. La glycémie est toujours envoyée en
// mg/dL, arrondie à l'entier le plus proche (l'API n'accepte que des
// entiers) quelle que soit l'unité choisie pour la saisie — voir
// lib/uniteGlycemie.js.
function versPayload(etat) {
  const estTension = etat.type === 'tension';
  const estGlycemie = etat.type === 'glycemie';
  let valeur1 = etat.valeur1 === '' ? null : Number(etat.valeur1);
  if (estGlycemie && valeur1 != null) {
    valeur1 = Math.round(convertirVersMgDl(valeur1, etat.uniteGlycemie));
  }
  return {
    type: etat.type,
    valeur1,
    valeur2: estTension && etat.valeur2 !== '' ? Number(etat.valeur2) : null,
    pouls: estTension && etat.pouls !== '' ? Number(etat.pouls) : null,
    contexte: etat.contexte,
    note: etat.note.trim() ? etat.note.trim() : null,
    dateHeure: depuisDatetimeLocal(etat.dateHeureTexte),
  };
}

export default function SaisirMesurePage() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const location = useLocation();

  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { rafraichirCompteurEnAttente } = useOutletContext();

  // En mode édition, l'état du formulaire n'existe qu'une fois la
  // mesure à modifier connue (voir l'effet ci-dessous) : null tant
  // qu'elle n'est pas prête.
  const [etat, setEtat] = useState(() => (modeEdition ? null : etatInitial()));
  const [chargementMesure, setChargementMesure] = useState(modeEdition && !location.state?.mesure);
  const [erreurs, setErreurs] = useState({});
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [retour, setRetour] = useState(null);

  useEffect(() => {
    if (!modeEdition) return;

    // Cas normal : on vient de l'historique, qui a passé la mesure via
    // la navigation (évite un aller-retour réseau inutile).
    if (location.state?.mesure) {
      setEtat(etatDepuisMesure(location.state.mesure));
      return;
    }

    // Cas plus rare (arrivée directe sur l'URL, ex: rechargement de
    // page) : pas de mesure transmise, on la retrouve en rechargeant la
    // liste — il n'existe pas de GET /mesures/:id dédié côté API.
    let annule = false;
    async function chargerMesure() {
      try {
        const token = await getToken();
        const mesures = await appelApi('/mesures', { token });
        if (annule) return;
        const trouvee = mesures.find((m) => m.id === id);
        if (trouvee) setEtat(etatDepuisMesure(trouvee));
        else setRetour({ statut: 'erreur', texte: 'Mesure introuvable (peut-être déjà supprimée).' });
      } catch (err) {
        if (err instanceof SessionExpireeError) {
          await signOut();
          navigate('/connexion', { replace: true });
          return;
        }
        if (!annule) setRetour({ statut: 'erreur', texte: 'Impossible de charger cette mesure.' });
      } finally {
        if (!annule) setChargementMesure(false);
      }
    }
    chargerMesure();
    return () => {
      annule = true;
    };
    // location.state ne change pas pendant la vie de la page : seul id
    // doit redéclencher ce chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function majChamp(champ, valeur) {
    setEtat((precedent) => ({ ...precedent, [champ]: valeur }));
  }

  function changerType(type) {
    // Change de type = les champs et contextes valides changent : on
    // repart de valeurs vierges pour éviter de garder, par exemple, une
    // "diastolique" saisie pour une tension alors qu'on bascule sur
    // glycémie.
    setEtat((precedent) => ({ ...etatInitial(), type, dateHeureTexte: precedent.dateHeureTexte }));
    setErreurs({});
    setRetour(null);
  }

  // Changer d'unité convertit la valeur déjà saisie plutôt que de la
  // vider, et mémorise le choix pour les prochaines saisies/l'affichage
  // (historique, tendances, export) sur cet appareil.
  function changerUniteGlycemie(unite) {
    setEtat((precedent) => ({
      ...precedent,
      uniteGlycemie: unite,
      valeur1:
        precedent.valeur1 === ''
          ? ''
          : formaterNombreDepuisMgDl(convertirVersMgDl(Number(precedent.valeur1), precedent.uniteGlycemie), unite),
    }));
    ecrireUnitePreferee(unite);
  }

  async function gererEnvoi(e) {
    e.preventDefault();

    const payload = versPayload(etat);
    const erreursValidation = validerMesure(payload, { uniteGlycemie: etat.uniteGlycemie });
    setErreurs(erreursValidation);

    if (!estValide(erreursValidation)) {
      setRetour({ statut: 'erreur', texte: 'Corrige les champs indiqués avant d’enregistrer.' });
      return;
    }

    setEnvoiEnCours(true);
    setRetour(null);

    const corpsRequete = { ...payload, dateHeure: payload.dateHeure.toISOString() };

    if (modeEdition) {
      await envoyerModification(corpsRequete);
    } else {
      await envoyerCreation(corpsRequete);
    }

    setEnvoiEnCours(false);
  }

  async function envoyerCreation(corpsRequete) {
    try {
      if (!navigator.onLine) {
        throw new TypeError('hors-ligne');
      }
      const token = await getToken();
      await appelApi('/mesures', { method: 'POST', token, body: JSON.stringify(corpsRequete) });
      setRetour({ statut: 'succes', texte: 'Mesure enregistrée.' });
      reinitialiserApresEnvoi();
    } catch (err) {
      if (err instanceof SessionExpireeError) {
        await signOut();
        navigate('/connexion', { replace: true });
        return;
      }
      if (err instanceof TypeError) {
        // Pas de réseau (soit détecté via navigator.onLine, soit parce
        // que fetch() a échoué avant même d'atteindre le serveur) : on
        // ne perd pas la saisie, elle part dans la file d'attente locale.
        await ajouterMesureEnAttente(corpsRequete);
        await rafraichirCompteurEnAttente();
        setRetour({
          statut: 'horsligne',
          texte: 'Hors connexion : mesure enregistrée sur cet appareil, elle sera envoyée automatiquement au retour du réseau.',
        });
        reinitialiserApresEnvoi();
      } else {
        gererErreurValidationServeur(err);
      }
    }
  }

  async function envoyerModification(corpsRequete) {
    try {
      if (!navigator.onLine) {
        throw new TypeError('hors-ligne');
      }
      const token = await getToken();
      await appelApi(`/mesures/${id}`, { method: 'PATCH', token, body: JSON.stringify(corpsRequete) });
      // Contrairement à la création, on ne reste pas sur place : l'édition
      // est une action ponctuelle, on revient directement à la liste où
      // la ligne mise à jour sera visible.
      navigate('/historique', { replace: true });
    } catch (err) {
      if (err instanceof SessionExpireeError) {
        await signOut();
        navigate('/connexion', { replace: true });
        return;
      }
      if (err instanceof TypeError) {
        // On ne met pas les modifications en file d'attente : contrairement
        // à une création, une édition cible un enregistrement précis côté
        // serveur, et gérer ce cas hors-ligne proprement demanderait une
        // logique de fusion plus complexe, hors scope pour l'instant.
        setRetour({
          statut: 'erreur',
          texte: 'Connexion requise pour enregistrer une modification. Réessaie une fois en ligne.',
        });
      } else {
        gererErreurValidationServeur(err);
      }
    }
  }

  function gererErreurValidationServeur(err) {
    if (err.status === 400 && err.details) {
      // Le serveur a quand même refusé la mesure (garde-fou ultime, voir
      // mesureSchemas.js côté backend) : on réaffiche ses erreurs champ
      // par champ, au même endroit que la validation locale.
      const erreursServeur = {};
      for (const detail of err.details) erreursServeur[detail.champ] = detail.message;
      setErreurs(erreursServeur);
      setRetour({ statut: 'erreur', texte: 'Corrige les champs indiqués avant d’enregistrer.' });
    } else {
      setRetour({ statut: 'erreur', texte: err.message || 'Une erreur est survenue, réessaie.' });
    }
  }

  function reinitialiserApresEnvoi() {
    setEtat((precedent) => ({
      ...precedent,
      valeur1: '',
      valeur2: '',
      pouls: '',
      note: '',
      dateHeureTexte: versDatetimeLocal(new Date()),
    }));
    setErreurs({});
  }

  if (modeEdition && chargementMesure) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4 pb-24">
        <p className="font-sans text-sm text-neutral-500">Chargement…</p>
      </main>
    );
  }

  if (modeEdition && !etat) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 pb-24">
        <MessageRetour statut={retour?.statut} texte={retour?.texte} />
        <button
          type="button"
          onClick={() => navigate('/historique')}
          className="font-sans text-sm text-teal underline"
        >
          Retour à l’historique
        </button>
      </main>
    );
  }

  const estTension = etat.type === 'tension';
  const optionsContexte = CONTEXTES_PAR_TYPE[etat.type];

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <h1 className="text-center font-display text-3xl font-semibold text-teal">
          {modeEdition ? 'Modifier la mesure' : 'Nouvelle mesure'}
        </h1>

        <OngletsType valeur={etat.type} onChange={changerType} />

        <form onSubmit={gererEnvoi} className="flex flex-col gap-6">
          {estTension ? (
            <div className="flex justify-center gap-4">
              <NumericField
                id="valeur1"
                label="Systolique"
                unite="mmHg"
                value={etat.valeur1}
                onChange={(v) => majChamp('valeur1', v)}
                erreur={erreurs.valeur1}
                autoFocus
              />
              <NumericField
                id="valeur2"
                label="Diastolique"
                unite="mmHg"
                value={etat.valeur2}
                onChange={(v) => majChamp('valeur2', v)}
                erreur={erreurs.valeur2}
              />
              <NumericField
                id="pouls"
                label="Pouls"
                unite="bpm"
                value={etat.pouls}
                onChange={(v) => majChamp('pouls', v)}
                erreur={erreurs.pouls}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <NumericField
                id="valeur1"
                label="Glycémie"
                unite={etat.uniteGlycemie}
                decimales={DECIMALES_PAR_UNITE[etat.uniteGlycemie]}
                value={etat.valeur1}
                onChange={(v) => majChamp('valeur1', v)}
                erreur={erreurs.valeur1}
                autoFocus
              />
              <div className="w-40">
                <SelecteurSegments
                  options={OPTIONS_UNITE_GLYCEMIE}
                  valeur={etat.uniteGlycemie}
                  onChange={changerUniteGlycemie}
                />
              </div>
            </div>
          )}

          <ContextChips
            options={optionsContexte}
            value={etat.contexte}
            onChange={(v) => majChamp('contexte', v)}
            erreur={erreurs.contexte}
          />

          <DateHeureField
            value={etat.dateHeureTexte}
            onChange={(v) => majChamp('dateHeureTexte', v)}
            erreur={erreurs.dateHeure}
          />

          <NoteField value={etat.note} onChange={(v) => majChamp('note', v)} erreur={erreurs.note} />

          <MessageRetour statut={retour?.statut} texte={retour?.texte} />

          <BoutonEnregistrer
            chargement={envoiEnCours}
            texte={modeEdition ? 'Enregistrer les modifications' : 'Enregistrer la mesure'}
          />

          {modeEdition && (
            <button
              type="button"
              onClick={() => navigate('/historique')}
              className="font-sans text-sm text-neutral-500 underline"
            >
              Annuler
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
