// Écran de connexion / inscription.
//
// Construit avec les hooks "headless" de Clerk (useSignIn / useSignUp)
// plutôt qu'avec ses composants pré-stylés (<SignIn />, <SignUp />) : ça
// donne un contrôle total sur le HTML/CSS, nécessaire pour respecter le
// design system de Constance (fond papier, titre en Fraunces, bouton
// teal) plutôt que le style par défaut de Clerk.
//
// Rappel important (voir aussi middleware/clerkAuth.js côté backend) :
// tout ce qui se passe ici (signIn.create, signUp.create...) se déroule
// entre le navigateur et les serveurs Clerk. Ça authentifie
// l'utilisateur auprès de Clerk et ouvre une session locale, mais ça ne
// "prouve" rien à NOTRE backend. C'est pour ça que chaque appel à notre
// API (voir lib/api.js) doit envoyer le token de cette session, que le
// backend vérifie lui-même de façon indépendante.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/clerk-react';

// Traduit les erreurs Clerk (souvent en anglais, orientées technique) en
// messages compréhensibles, sans jamais afficher la erreur brute à
// l'utilisateur.
function messageErreurLisible(err) {
  const code = err?.errors?.[0]?.code;
  switch (code) {
    case 'form_identifier_not_found':
      return 'Aucun compte ne correspond à cet email.';
    case 'form_password_incorrect':
      return 'Mot de passe incorrect.';
    case 'form_identifier_exists':
      return 'Un compte existe déjà avec cet email.';
    case 'form_password_pwned':
      return 'Ce mot de passe est trop courant/compromis. Choisis-en un autre.';
    case 'form_code_incorrect':
      return 'Code de vérification incorrect.';
    default:
      return 'Une erreur est survenue. Réessaie dans un instant.';
  }
}

const classeChamp =
  'w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 font-sans text-neutral-800 focus:outline-none focus:ring-2 focus:ring-teal';
const classeBouton =
  'w-full rounded-lg bg-teal py-2 font-sans font-medium text-white transition-colors hover:bg-teal/90 disabled:opacity-50';

export default function ConnexionPage() {
  const navigate = useNavigate();
  const { isLoaded: signInPret, signIn, setActive: activerSessionConnexion } = useSignIn();
  const { isLoaded: signUpPret, signUp, setActive: activerSessionInscription } = useSignUp();

  // "connexion" | "inscription" | "verification" (étape de saisie du
  // code envoyé par email après inscription)
  const [mode, setMode] = useState('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function gererConnexion(e) {
    e.preventDefault();
    if (!signInPret) return;
    setErreur('');
    setChargement(true);
    try {
      const resultat = await signIn.create({ identifier: email, password: motDePasse });
      if (resultat.status === 'complete') {
        await activerSessionConnexion({ session: resultat.createdSessionId });
        navigate('/', { replace: true });
      } else {
        setErreur("Étape de connexion supplémentaire requise, non gérée par cet écran.");
      }
    } catch (err) {
      // Le message affiché à l'utilisateur reste volontairement générique
      // (messageErreurLisible) ; le détail technique part dans la console
      // pour le débogage — jamais affiché tel quel dans l'interface.
      console.error('[Clerk]', err?.errors ?? err);
      setErreur(messageErreurLisible(err));
    } finally {
      setChargement(false);
    }
  }

  async function gererInscription(e) {
    e.preventDefault();
    if (!signUpPret) return;
    setErreur('');
    setChargement(true);
    try {
      await signUp.create({ emailAddress: email, password: motDePasse });
      // Clerk envoie un code de vérification par email par défaut.
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setMode('verification');
    } catch (err) {
      // Le message affiché à l'utilisateur reste volontairement générique
      // (messageErreurLisible) ; le détail technique part dans la console
      // pour le débogage — jamais affiché tel quel dans l'interface.
      console.error('[Clerk]', err?.errors ?? err);
      setErreur(messageErreurLisible(err));
    } finally {
      setChargement(false);
    }
  }

  async function gererVerification(e) {
    e.preventDefault();
    if (!signUpPret) return;
    setErreur('');
    setChargement(true);
    try {
      const resultat = await signUp.attemptEmailAddressVerification({ code });
      if (resultat.status === 'complete') {
        await activerSessionInscription({ session: resultat.createdSessionId });
        navigate('/', { replace: true });
      } else {
        setErreur('Code invalide ou incomplet.');
      }
    } catch (err) {
      // Le message affiché à l'utilisateur reste volontairement générique
      // (messageErreurLisible) ; le détail technique part dans la console
      // pour le débogage — jamais affiché tel quel dans l'interface.
      console.error('[Clerk]', err?.errors ?? err);
      setErreur(messageErreurLisible(err));
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-display text-4xl font-semibold text-teal">Constance</h1>

      <div className="w-full max-w-sm rounded-2xl bg-white/60 p-6 shadow-sm">
        {mode !== 'verification' && (
          <div className="mb-6 flex gap-2 rounded-lg bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setMode('connexion')}
              className={`flex-1 rounded-md py-1.5 font-sans text-sm transition-colors ${
                mode === 'connexion' ? 'bg-white text-teal shadow-sm' : 'text-neutral-500'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode('inscription')}
              className={`flex-1 rounded-md py-1.5 font-sans text-sm transition-colors ${
                mode === 'inscription' ? 'bg-white text-teal shadow-sm' : 'text-neutral-500'
              }`}
            >
              Inscription
            </button>
          </div>
        )}

        {mode === 'connexion' && (
          <form onSubmit={gererConnexion} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={classeChamp}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className={classeChamp}
            />
            {erreur && <p className="font-sans text-sm text-corail">{erreur}</p>}
            <button type="submit" disabled={chargement} className={classeBouton}>
              {chargement ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        )}

        {mode === 'inscription' && (
          <form onSubmit={gererInscription} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={classeChamp}
            />
            <input
              type="password"
              placeholder="Mot de passe (8 caractères minimum)"
              required
              minLength={8}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className={classeChamp}
            />
            {/* Requis par Clerk pour la protection anti-bot (Smart CAPTCHA) sur
                l'inscription : sans ce point d'ancrage, Clerk ne peut pas monter
                son challenge (invisible la plupart du temps) et signUp.create()
                reste bloqué indéfiniment sans jamais résoudre ni rejeter — d'où
                le bouton qui restait coincé sur "Création…". Voir
                https://clerk.com/docs/guides/development/custom-flows/bot-sign-up-protection */}
            <div id="clerk-captcha" />

            {erreur && <p className="font-sans text-sm text-corail">{erreur}</p>}
            <button type="submit" disabled={chargement} className={classeBouton}>
              {chargement ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
        )}

        {mode === 'verification' && (
          <form onSubmit={gererVerification} className="flex flex-col gap-4">
            <p className="font-sans text-sm text-neutral-600">
              Un code de vérification a été envoyé à <strong>{email}</strong>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Code à 6 chiffres"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={classeChamp}
            />
            {erreur && <p className="font-sans text-sm text-corail">{erreur}</p>}
            <button type="submit" disabled={chargement} className={classeBouton}>
              {chargement ? 'Vérification…' : 'Valider le code'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
