/*
 * Habillage des écrans connectés :
 * menu latéral noir fixe (≥ 1024 px) ou en panneau coulissant (tablette), en-tête, contenu centré.
 * Le contenu de chaque page apparaît avec une courte transition ; les pages sont chargées à la demande.
 */
import { Suspense, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Menu } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { formatDateLongue } from '@/lib/format'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/Sidebar'
import { FilAriane, FilProvider } from '@/components/layout/FilAriane'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Alertes } from '@/components/layout/Alertes'
import { Avatar } from '@/components/commun/Avatar'
import { ChargementPage } from '@/components/layout/Chargement'
import { transitionPage } from '@/components/commun/animations'

export function AppShell() {
  const { utilisateur, deconnexion } = useAuth()
  const [menuOuvert, setMenuOuvert] = useState(false)
  // Date du jour de l'en-tête, calculée une fois à l'ouverture de l'application
  const [aujourdHui] = useState(() => formatDateLongue(new Date()))
  const location = useLocation()
  const naviguer = useNavigate()
  const compte = utilisateur?.profil === 'GERANT' ? '/gerant/compte' : '/chef/compte'

  const seDeconnecter = async () => {
    setMenuOuvert(false)
    await deconnexion()
    toast.success('Vous êtes déconnecté.')
    naviguer('/connexion', { replace: true })
  }

  return (
    <FilProvider>
      <div className="bg-bg min-h-svh">
        <a
          href="#contenu"
          className="bg-strong text-bg sr-only z-[60] rounded-lg px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Aller au contenu
        </a>

        {/* Menu latéral fixe (ordinateur) */}
        <aside className="border-sideline fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r lg:block">
          <Sidebar onDeconnexion={seDeconnecter} />
        </aside>

        {/* Menu latéral coulissant (tablette, moins de 1024 px) */}
        <Sheet open={menuOuvert} onOpenChange={setMenuOuvert}>
          <SheetContent
            side="left"
            className="border-sideline bg-side [&>button]:text-sidetxt w-[280px] p-0 sm:max-w-[280px]"
          >
            <SheetTitle className="sr-only">Menu principal</SheetTitle>
            <SheetDescription className="sr-only">Navigation dans l'application</SheetDescription>
            <Sidebar onNaviguer={() => setMenuOuvert(false)} onDeconnexion={seDeconnecter} />
          </SheetContent>
        </Sheet>

        <div className="lg:pl-[260px]">
          {/* En-tête */}
          <header className="border-line bg-bg/90 sticky top-0 z-30 flex min-h-[64px] items-center gap-3 border-b px-4 py-3 backdrop-blur-md sm:px-8">
            <button
              type="button"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
              className="border-line bg-surf text-ink hover:bg-surf2 inline-flex size-[38px] cursor-pointer items-center justify-center rounded-[10px] border lg:hidden"
            >
              <Menu className="size-[18px]" />
            </button>
            <FilAriane className="flex-1" />
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="text-mutedtxt mr-1 hidden text-[14px] md:inline">{aujourdHui}</span>
              <ThemeToggle />
              <Alertes />
              <Link
                to={compte}
                aria-label="Mon compte"
                className="focus-visible:outline-ink rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Avatar utilisateur={utilisateur} taille={42} />
              </Link>
            </div>
          </header>

          {/* Contenu */}
          <main id="contenu" className="mx-auto w-full max-w-[1280px] px-4 pt-7 pb-12 sm:px-8">
            <motion.div key={location.pathname} {...transitionPage}>
              <Suspense fallback={<ChargementPage />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </main>
        </div>
      </div>
    </FilProvider>
  )
}
