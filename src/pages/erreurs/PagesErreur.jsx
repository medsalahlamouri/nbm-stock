/*
 * Pages d'erreur : 404 (route inconnue), erreur inattendue (errorElement du routeur),
 * profil illisible (session sans ligne utilisateur).
 */
import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Compass, LogOut, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/commun/Logo'
import { messageErreur } from '@/lib/erreurs'
import { supabase } from '@/lib/supabase'

function Cadre({ icone: Icone, code, titre, message, actions, dansApplication = false }) {
  return (
    <div
      className={`bg-bg flex flex-col items-center justify-center px-6 py-12 text-center ${dansApplication ? 'min-h-[60vh]' : 'min-h-svh'}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="flex max-w-md flex-col items-center gap-5"
      >
        {!dansApplication && <Logo taille={48} inverse />}
        <span className="bg-surf text-mutedtxt ring-line inline-flex size-14 items-center justify-center rounded-2xl ring-1">
          <Icone className="size-6" aria-hidden="true" />
        </span>
        {code && (
          <p className="text-muted2 font-mono text-[13px] font-semibold tracking-widest">{code}</p>
        )}
        <h1 className="text-strong font-serif text-[28px] leading-tight font-semibold tracking-[-0.02em]">
          {titre}
        </h1>
        <p className="text-mutedtxt text-[15px]">{message}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">{actions}</div>
      </motion.div>
    </div>
  )
}

/** 404 ; `dansApplication` : affichée dans le contenu de l'AppShell (sans logo, hauteur réduite) */
export function PageIntrouvable({ dansApplication = false }) {
  return (
    <Cadre
      dansApplication={dansApplication}
      icone={Compass}
      code="ERREUR 404"
      titre="Page introuvable"
      message="L'adresse demandée n'existe pas ou n'est plus disponible."
      actions={
        <Button asChild>
          <Link to="/">
            <ArrowLeft /> Retour au tableau de bord
          </Link>
        </Button>
      }
    />
  )
}

export function PageErreur() {
  const erreur = useRouteError()
  const introuvable = isRouteErrorResponse(erreur) && erreur.status === 404
  if (introuvable) return <PageIntrouvable />
  // Échec de chargement d'un fichier de page (souvent après une mise à jour du site) : recharger suffit
  const chargement =
    /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
      String(erreur?.message ?? ''),
    )
  return (
    <Cadre
      icone={TriangleAlert}
      titre="Une erreur inattendue est survenue"
      message={
        chargement
          ? "La page n'a pas pu être chargée. Rechargez l'application pour obtenir la dernière version."
          : messageErreur(erreur, "L'écran n'a pas pu s'afficher.")
      }
      actions={
        <>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw /> Recharger
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Retour à l'accueil</a>
          </Button>
        </>
      }
    />
  )
}

export function PageErreurProfil({ erreur }) {
  return (
    <Cadre
      icone={TriangleAlert}
      titre="Profil indisponible"
      message={
        erreur
          ? messageErreur(erreur)
          : 'Votre compte est introuvable ou désactivé. Contactez le gérant.'
      }
      actions={
        <>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw /> Réessayer
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.assign('/connexion')
            }}
          >
            <LogOut /> Se déconnecter
          </Button>
        </>
      }
    />
  )
}
