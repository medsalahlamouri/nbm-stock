/*
 * Gardes de routes (docs/CONVENTIONS.md §4 règles 5 et 7).
 * - RouteProtegee : il faut être connecté ; mot de passe provisoire → /changer-mot-de-passe obligatoire.
 * - RouteProfil : un profil n'ouvre jamais les écrans de l'autre (redirection vers son tableau de bord).
 * - RoutePublique : la page de connexion redirige une personne déjà connectée.
 * Ce masquage est une commodité : la sécurité réelle est assurée par la RLS côté serveur.
 */
import { Navigate, Outlet, useLocation } from 'react-router'
import { accueilDuProfil, useAuth } from '@/hooks/useAuth'
import { EcranDemarrage } from '@/components/layout/Chargement'
import { PageErreurProfil } from '@/pages/erreurs/PagesErreur'

export function RouteProtegee() {
  const { session, utilisateur, chargement, erreurProfil } = useAuth()
  const location = useLocation()

  if (chargement) return <EcranDemarrage />
  if (!session) return <Navigate to="/connexion" replace state={{ depuis: location.pathname }} />
  if (erreurProfil || !utilisateur) return <PageErreurProfil erreur={erreurProfil} />
  if (utilisateur.doit_changer_mdp && location.pathname !== '/changer-mot-de-passe') {
    return <Navigate to="/changer-mot-de-passe" replace />
  }
  return <Outlet />
}

export function RouteProfil({ profil }) {
  const { utilisateur } = useAuth()
  if (utilisateur?.profil !== profil)
    return <Navigate to={accueilDuProfil(utilisateur?.profil)} replace />
  return <Outlet />
}

export function RoutePublique() {
  const { session, utilisateur } = useAuth()
  // Écran de démarrage seulement à l'ouverture : pendant une connexion, le formulaire reste affiché
  // (il doit pouvoir montrer « Compte désactivé » si le serveur refuse).
  if (session === undefined) return <EcranDemarrage />
  if (session && utilisateur?.actif) {
    return (
      <Navigate
        to={
          utilisateur.doit_changer_mdp
            ? '/changer-mot-de-passe'
            : accueilDuProfil(utilisateur.profil)
        }
        replace
      />
    )
  }
  return <Outlet />
}

/** Redirection de la racine « / » vers le bon tableau de bord */
export function RedirectionAccueil() {
  const { session, utilisateur, chargement } = useAuth()
  if (chargement) return <EcranDemarrage />
  if (!session || !utilisateur) return <Navigate to="/connexion" replace />
  return <Navigate to={accueilDuProfil(utilisateur.profil)} replace />
}
