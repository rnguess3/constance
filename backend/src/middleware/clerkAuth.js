// Vérification d'authentification RÉELLE, via Clerk — remplace l'ancien
// middleware temporaire (header x-user-id) maintenant que l'auth est en
// place.
//
// Différence entre "authentification côté client" et "vérification côté
// serveur" (voir aussi pages/ConnexionPage.jsx côté frontend) :
//   - Le FRONTEND (Clerk React) gère le formulaire de connexion, échange
//     l'email/mot de passe avec les serveurs Clerk, et récupère en retour
//     un token (JWT) signé par Clerk prouvant "cet utilisateur est
//     connecté". Ce token est ensuite envoyé au backend dans l'en-tête
//     Authorization de chaque requête.
//   - Mais un token envoyé par le client n'est digne de confiance QUE si
//     le serveur le vérifie lui-même. clerkMiddleware() ci-dessous
//     recalcule la signature du JWT reçu à partir des clés publiques de
//     Clerk (via CLERK_SECRET_KEY, configuré côté serveur uniquement) :
//     si la signature ne correspond pas, ou que le token est expiré, ou
//     qu'il n'a pas été émis par notre instance Clerk, la requête est
//     rejetée. C'est cette vérification serveur — pas la simple présence
//     d'un header — qui garantit qu'un attaquant ne peut pas se faire
//     passer pour un autre utilisateur en fabriquant son propre token.
//
// C'est exactement ce que l'ancien middleware temporaire ne faisait PAS :
// il faisait confiance à un header que n'importe qui pouvait falsifier.
import { clerkMiddleware, getAuth } from '@clerk/express';

const clerkAuthMiddleware = clerkMiddleware();

// Analyse le token présent dans chaque requête (s'il y en a un) et pose
// req.userId une bonne fois pour toutes (null si absent/invalide). À
// monter une seule fois, globalement, dans server.js.
//
// clerkMiddleware() lève une erreur si le token fourni a la forme d'un
// JWT (3 segments séparés par des points) mais un contenu illisible : un
// bug de robustesse de son décodeur interne, qui plante au lieu de
// renvoyer proprement "token invalide". On l'intercepte donc ici (`err`
// dans le callback) pour traiter ce cas comme une absence de session
// valide, plutôt que de laisser remonter une erreur 500 côté client pour
// un simple problème d'authentification.
//
// Important : on lit getAuth(req) UNE SEULE FOIS, ici, dans le callback
// de clerkAuthMiddleware. Après une erreur, Clerk n'a pas forcément posé
// le contexte interne que getAuth() attend — le rappeler plus tard (ex.
// dans exigerUtilisateurConnecte) lèverait une seconde erreur du type
// "clerkMiddleware not registered". req.userId sert donc de source de
// vérité unique pour la suite de la requête.
export function analyserAuthentification(req, res, next) {
  clerkAuthMiddleware(req, res, (err) => {
    req.userId = err ? null : getAuth(req).userId ?? null;
    next();
  });
}

// À utiliser sur les routes qui exigent un utilisateur connecté. Se base
// sur req.userId posé par analyserAuthentification (jamais un header
// fourni par le client : req.userId vient d'un token dont la signature a
// été vérifiée par Clerk) ; sinon renvoie une erreur 401 propre — jamais
// de détail technique brut renvoyé au client.
export function exigerUtilisateurConnecte(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({
      erreur: 'Authentification requise ou session expirée',
    });
  }
  next();
}
