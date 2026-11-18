/*
 * Habillage des pages d'accès : fond --bg avec halo radial clair en haut et fines
 * lignes verticales tous les 88 px, logo inversé 64 px, « NBM », carte centrée de 440 px, pied de page,
 * bouton thème en haut à droite.
 */
import { motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { Logo } from '@/components/commun/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const ANNEE = new Date().getFullYear()

export function CadreAuth({ children }) {
  return (
    <div className="bg-bg relative flex min-h-svh flex-col items-center overflow-hidden px-4 py-10 sm:py-14">
      {/* Halo et lignes verticales décoratifs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% 0%, color-mix(in srgb, var(--surf) 85%, transparent), transparent 70%), repeating-linear-gradient(90deg, transparent 0 87px, color-mix(in srgb, var(--ink) 2.5%, transparent) 87px 88px)',
        }}
      />
      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex w-full max-w-[440px] flex-col items-center"
      >
        <Logo taille={64} inverse />
        <p className="text-strong mt-4 font-serif text-[30px] leading-none font-semibold tracking-[-0.01em]">
          NBM
        </p>
        <p className="text-mutedtxt mt-2 text-[11px] font-semibold tracking-[0.28em] uppercase">
          Nabeul Bois et Meubles
        </p>

        <div className="border-line bg-surf shadow-pop mt-8 w-full rounded-[18px] border px-6 pt-8 pb-7 sm:px-[34px] sm:pt-[34px] sm:pb-7">
          {children}
        </div>

        <footer className="text-mutedtxt mt-6 flex flex-col items-center gap-1 text-center text-[13px]">
          <p className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden="true" /> Connexion sécurisée · accès réservé au
            personnel de NBM
          </p>
          <p>© {ANNEE} Nabeul Bois et Meubles · Gestion de stock, version 1.0</p>
        </footer>
      </motion.div>
    </div>
  )
}
