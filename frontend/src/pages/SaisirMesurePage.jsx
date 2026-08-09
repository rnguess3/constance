// Écran principal : saisie rapide d'une mesure de tension ou de
// glycémie. Assemble les petits composants de components/saisie/*,
// gère la validation, l'envoi à l'API, et la bascule vers le stockage
// hors-ligne (IndexedDB) quand le réseau n'est pas disponible.
import { useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import OngletsType from '../components/saisie/OngletsType.jsx';
import NumericField from '../components/saisie/NumericField.jsx';
import ContextChips from '../components/saisie/ContextChips.jsx';
import NoteField from '../components/saisie/NoteField.jsx';
import DateHeureField, { versDatetimeLocal, depuisDatetimeLocal } from '../components/saisie/DateHeureField.jsx';
import BoutonEnregistrer from '../components/saisie/BoutonEnregistrer.jsx';
import MessageRetour from '../components/saisie/MessageRetour.jsx';
import { CONTEXTES_PAR_TYPE, validerMesure, estValide } from '../validation/mesureValidation.js';
import { appelApi, SessionExpireeError } from '../lib/api.js';
import { ajouterMesureEnAttente } from '../lib/mesuresHorsLigne.js';

function etatInitial() {
  return {
    type: 'tension',
    valeur1: '',
    valeur2: '',
    pouls: '',
    contexte: '',
    note: '',
    dateHeureTexte: versDatetimeLocal(new Date()),
  };
}

// Construit le corps JSON à envoyer à POST /mesures (ou à mettre en
// file d'attente) à partir de l'état brut du formulaire. Convertit les
// champs texte en nombres/null comme attendu par la validation
// (mesureValidation.js) et par l'API.
function versPayload(etat) {
  const estTension = etat.type === 'tension';
  return {
    type: etat.type,
    valeur1: etat.valeur1 === '' ? null : Number(etat.valeur1),
    valeur2: estTension && etat.valeur2 !== '' ? Number(etat.valeur2) : null,
    pouls: estTension && etat.pouls !== '' ? Number(etat.pouls) : null,
    contexte: etat.contexte,
    note: etat.note.trim() ? etat.note.trim() : null,
    dateHeure: depuisDatetimeLocal(etat.dateHeureTexte),
  };
}

export default function SaisirMesurePage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { rafraichirCompteurEnAttente } = useOutletContext();

  const [etat, setEtat] = useState(etatInitial);
  const [erreurs, setErreurs] = useState({});
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [retour, setRetour] = useState(null);

  const estTension = etat.type === 'tension';
  const optionsContexte = CONTEXTES_PAR_TYPE[etat.type];

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

  async function gererEnvoi(e) {
    e.preventDefault();

    const payload = versPayload(etat);
    const erreursValidation = validerMesure(payload);
    setErreurs(erreursValidation);

    if (!estValide(erreursValidation)) {
      setRetour({ statut: 'erreur', texte: 'Corrige les champs indiqués avant d’enregistrer.' });
      return;
    }

    setEnvoiEnCours(true);
    setRetour(null);

    const corpsRequete = { ...payload, dateHeure: payload.dateHeure.toISOString() };

    try {
      if (!navigator.onLine) {
        throw new TypeError('hors-ligne');
      }
      const token = await getToken();
      await appelApi('/mesures', {
        method: 'POST',
        token,
        body: JSON.stringify(corpsRequete),
      });
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
      } else if (err.status === 400 && err.details) {
        // Le serveur a quand même refusé la mesure (garde-fou ultime,
        // voir mesureSchemas.js côté backend) : on réaffiche ses erreurs
        // champ par champ, au même endroit que la validation locale.
        const erreursServeur = {};
        for (const detail of err.details) erreursServeur[detail.champ] = detail.message;
        setErreurs(erreursServeur);
        setRetour({ statut: 'erreur', texte: 'Corrige les champs indiqués avant d’enregistrer.' });
      } else {
        setRetour({ statut: 'erreur', texte: err.message || 'Une erreur est survenue, réessaie.' });
      }
    } finally {
      setEnvoiEnCours(false);
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

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <h1 className="text-center font-display text-3xl font-semibold text-teal">Nouvelle mesure</h1>

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
            <div className="flex justify-center">
              <NumericField
                id="valeur1"
                label="Glycémie"
                unite="mg/dL"
                value={etat.valeur1}
                onChange={(v) => majChamp('valeur1', v)}
                erreur={erreurs.valeur1}
                autoFocus
              />
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

          <BoutonEnregistrer chargement={envoiEnCours} />
        </form>
      </div>
    </main>
  );
}
