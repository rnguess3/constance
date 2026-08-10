// Écran "Réglages" : rappels quotidiens (notifications push). La demande
// de permission navigateur n'est JAMAIS déclenchée au chargement de la
// page — seulement au clic sur "Activer les notifications", après avoir
// lu l'explication ci-dessous (contrainte : rester non-intrusif).
import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import MessageRetour from '../components/MessageRetour.jsx';
import LigneRappel from '../components/reglages/LigneRappel.jsx';
import { appelApi, SessionExpireeError } from '../lib/api.js';
import { pushEstDisponible, obtenirAbonnementActuel, creerAbonnement, supprimerAbonnementLocal } from '../lib/pushNotifications.js';

// 'verification' | 'non-supporte' | 'defaut' | 'permission-sans-abonnement' | 'refuse' | 'accorde'
export default function ReglagesPage() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [etatPermission, setEtatPermission] = useState('verification');
  const [reglages, setReglages] = useState(null);
  const [erreur, setErreur] = useState('');
  const [messageSucces, setMessageSucces] = useState('');
  const [activationEnCours, setActivationEnCours] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  useEffect(() => {
    let annule = false;

    async function detecterEtatInitial() {
      if (!pushEstDisponible()) {
        if (!annule) setEtatPermission('non-supporte');
        return;
      }
      if (Notification.permission === 'denied') {
        if (!annule) setEtatPermission('refuse');
        return;
      }
      if (Notification.permission !== 'granted') {
        if (!annule) setEtatPermission('defaut');
        return;
      }
      // Permission déjà accordée : encore faut-il qu'un abonnement push
      // existe pour CET appareil (peut avoir été perdu, ex. nettoyage du
      // service worker sans que la permission navigateur soit révoquée).
      const abonnement = await obtenirAbonnementActuel();
      if (!annule) setEtatPermission(abonnement ? 'accorde' : 'permission-sans-abonnement');
    }

    detecterEtatInitial();
    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    if (etatPermission !== 'accorde') return;
    let annule = false;

    async function charger() {
      try {
        const token = await getToken();
        const donnees = await appelApi('/rappels/reglages', { token });
        if (!annule) setReglages(donnees);
      } catch (err) {
        if (err instanceof SessionExpireeError) {
          await signOut();
          navigate('/connexion', { replace: true });
          return;
        }
        if (!annule) setErreur(err.message || 'Impossible de charger les réglages de rappel.');
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, [etatPermission, getToken, navigate, signOut]);

  async function envoyerAbonnementAuBackend(abonnement) {
    const token = await getToken();
    await appelApi('/rappels/abonnements', { method: 'POST', token, body: JSON.stringify(abonnement.toJSON()) });
  }

  async function gererActivation() {
    setErreur('');
    setActivationEnCours(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        setEtatPermission('refuse');
        return;
      }
      if (permission !== 'granted') {
        // Fenêtre fermée sans choisir explicitement : on reste sur l'écran
        // d'explication, l'utilisateur pourra retenter.
        return;
      }
      const abonnement = await creerAbonnement();
      await envoyerAbonnementAuBackend(abonnement);
      setEtatPermission('accorde');
    } catch (err) {
      setErreur(err.message || 'Impossible d’activer les notifications.');
    } finally {
      setActivationEnCours(false);
    }
  }

  async function gererDesactivation() {
    setErreur('');
    setActivationEnCours(true);
    try {
      const abonnement = await obtenirAbonnementActuel();
      if (abonnement) {
        const { endpoint } = abonnement;
        await supprimerAbonnementLocal(abonnement);
        const token = await getToken();
        await appelApi('/rappels/abonnements', { method: 'DELETE', token, body: JSON.stringify({ endpoint }) });
      }
      setReglages(null);
      setMessageSucces('');
      setEtatPermission('permission-sans-abonnement');
    } catch (err) {
      setErreur(err.message || 'Impossible de désactiver les notifications.');
    } finally {
      setActivationEnCours(false);
    }
  }

  function majChamp(champ, valeur) {
    setReglages((precedent) => ({ ...precedent, [champ]: valeur }));
    setMessageSucces('');
  }

  async function gererEnregistrement() {
    setErreur('');
    setEnregistrementEnCours(true);
    try {
      const token = await getToken();
      const corps = {
        rappelMatinActif: reglages.rappelMatinActif,
        heureMatin: reglages.heureMatin,
        rappelSoirActif: reglages.rappelSoirActif,
        heureSoir: reglages.heureSoir,
        // Recapturé à chaque enregistrement : reflète le fuseau actuel de
        // l'appareil (utile si l'utilisateur voyage).
        fuseauHoraire: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      const donnees = await appelApi('/rappels/reglages', { method: 'PUT', token, body: JSON.stringify(corps) });
      setReglages(donnees);
      setMessageSucces('Réglages enregistrés.');
    } catch (err) {
      if (err instanceof SessionExpireeError) {
        await signOut();
        navigate('/connexion', { replace: true });
        return;
      }
      setErreur(err.message || 'Impossible d’enregistrer les réglages.');
    } finally {
      setEnregistrementEnCours(false);
    }
  }

  const dejaAutorise = etatPermission === 'permission-sans-abonnement';

  return (
    <main className="min-h-screen bg-paper px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <h1 className="text-center font-display text-3xl font-semibold text-teal">Réglages</h1>

        <MessageRetour statut={erreur ? 'erreur' : null} texte={erreur} />

        {etatPermission === 'verification' && (
          <p className="py-10 text-center font-sans text-sm text-neutral-500">Chargement…</p>
        )}

        {etatPermission === 'non-supporte' && (
          <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
            <p className="font-sans text-sm font-medium text-neutral-700">Rappels non disponibles sur cet appareil</p>
            <p className="mt-2 font-sans text-xs leading-relaxed text-neutral-500">
              Ton navigateur ne prend pas en charge les notifications. Sur iPhone/iPad : ajoute d’abord Constance à
              l’écran d’accueil (bouton Partager de Safari → « Sur l’écran d’accueil ») puis rouvre l’app depuis
              cette icône — Safari n’active les notifications web que pour les apps installées ainsi, à partir
              d’iOS 16.4.
            </p>
          </div>
        )}

        {etatPermission === 'refuse' && (
          <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
            <p className="font-sans text-sm font-medium text-neutral-700">Notifications refusées</p>
            <p className="mt-2 font-sans text-xs leading-relaxed text-neutral-500">
              Tu as refusé les notifications pour Constance. Pour activer les rappels, autorise-les depuis les
              réglages de ton navigateur pour ce site (icône de cadenas dans la barre d’adresse), puis reviens sur
              cet écran.
            </p>
          </div>
        )}

        {(etatPermission === 'defaut' || dejaAutorise) && (
          <div className="flex flex-col gap-3 rounded-xl bg-white px-4 py-4 shadow-sm">
            <p className="font-sans text-sm font-medium text-neutral-700">Active les rappels</p>
            <p className="font-sans text-xs leading-relaxed text-neutral-500">
              {dejaAutorise
                ? 'Les notifications ont déjà été autorisées pour Constance, mais aucun rappel n’est actif sur cet appareil — réactive-les ci-dessous (aucune nouvelle demande d’autorisation ne s’affichera).'
                : 'Reçois une notification discrète à l’heure de ta prise du matin et/ou du soir, même quand Constance est fermée. Ton navigateur va te demander une autorisation — tu peux la révoquer à tout moment depuis ses réglages.'}
            </p>
            <button
              type="button"
              onClick={gererActivation}
              disabled={activationEnCours}
              className="rounded-lg bg-teal px-4 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:opacity-50"
            >
              {activationEnCours ? 'Activation…' : 'Activer les notifications'}
            </button>
          </div>
        )}

        {etatPermission === 'accorde' && reglages && (
          <>
            <div className="flex flex-col gap-3">
              <LigneRappel
                id="rappel-matin"
                titre="Rappel du matin"
                actif={reglages.rappelMatinActif}
                heure={reglages.heureMatin}
                onChangeActif={(v) => majChamp('rappelMatinActif', v)}
                onChangeHeure={(v) => majChamp('heureMatin', v)}
              />
              <LigneRappel
                id="rappel-soir"
                titre="Rappel du soir"
                actif={reglages.rappelSoirActif}
                heure={reglages.heureSoir}
                onChangeActif={(v) => majChamp('rappelSoirActif', v)}
                onChangeHeure={(v) => majChamp('heureSoir', v)}
              />
            </div>

            <MessageRetour statut={messageSucces ? 'succes' : null} texte={messageSucces} />

            <button
              type="button"
              onClick={gererEnregistrement}
              disabled={enregistrementEnCours}
              className="rounded-lg bg-teal px-4 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:opacity-50"
            >
              {enregistrementEnCours ? 'Enregistrement…' : 'Enregistrer les réglages'}
            </button>

            <button
              type="button"
              onClick={gererDesactivation}
              disabled={activationEnCours}
              className="font-sans text-xs text-neutral-500 underline disabled:opacity-50"
            >
              Désactiver les notifications sur cet appareil
            </button>
          </>
        )}
      </div>
    </main>
  );
}
