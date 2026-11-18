/*
 * Menu latéral noir (docs/DESIGN.md §3) : logo, sections, liens avec compteurs, carte utilisateur.
 * Lien actif : fond --sideon, texte blanc, trait clair à gauche (la pastille glisse d'un lien à l'autre).
 */
import { Link, NavLink } from 'react-router'
import { motion } from 'motion/react'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useCompteursMenu } from '@/hooks/useCompteurs'
import { Logo } from '@/components/commun/Logo'
import { Avatar } from '@/components/commun/Avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MENU_CHEF, MENU_GERANT } from '@/components/layout/menus'

export function Sidebar({ onNaviguer, onDeconnexion }) {
  const { utilisateur } = useAuth()
  const profil = utilisateur?.profil
  const menu = profil === 'GERANT' ? MENU_GERANT : MENU_CHEF
  const { data: compteurs } = useCompteursMenu(profil)
  const compte = profil === 'GERANT' ? '/gerant/compte' : '/chef/compte'

  return (
    <div className="bg-side text-sidetxt flex h-full flex-col">
      {/* Logo */}
      <Link
        to={profil === 'GERANT' ? '/gerant' : '/chef'}
        onClick={onNaviguer}
        className="focus-visible:outline-sideav flex items-center gap-3 px-5 pt-5 pb-4 outline-none focus-visible:outline-2"
      >
        <Logo taille={34} />
        <span className="flex flex-col leading-tight">
          <span className="text-sidehi font-serif text-[17px] font-semibold">NBM Stock</span>
          <span className="text-sidemut text-[12px]">Nabeul Bois et Meubles</span>
        </span>
      </Link>

      {/* Liens */}
      <nav
        className="flex-1 [scrollbar-width:thin] overflow-y-auto px-3 pb-4"
        aria-label="Menu principal"
      >
        {menu.map((section, i) => (
          <div key={section.titre ?? i} className={cn(i > 0 && 'mt-5')}>
            {section.titre && (
              <p className="text-sidemut mb-1.5 px-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                {section.titre}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.liens.map((lien) => {
                const valeur = lien.compteur ? (compteurs?.[lien.compteur] ?? 0) : 0
                return (
                  <li key={lien.to}>
                    <NavLink
                      to={lien.to}
                      end={lien.exact}
                      onClick={onNaviguer}
                      className={({ isActive }) =>
                        cn(
                          'focus-visible:outline-sideav relative flex h-10 items-center gap-3 rounded-[9px] px-2.5 text-[14px] transition-colors duration-150 outline-none focus-visible:outline-2',
                          isActive
                            ? 'text-sidehi font-medium'
                            : 'text-sidetxt/86 hover:bg-sideon/60 hover:text-sidehi',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="lien-actif"
                              className="bg-sideon absolute inset-0 rounded-[9px] shadow-[inset_3px_0_0_var(--sideav)]"
                              transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                              aria-hidden="true"
                            />
                          )}
                          <lien.icone className="relative size-4 shrink-0" aria-hidden="true" />
                          <span className="relative flex-1 truncate">{lien.libelle}</span>
                          {valeur > 0 && (
                            <motion.span
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={cn(
                                'tabular relative inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white',
                                lien.ton === 'rouge' ? 'bg-red' : 'bg-gold2',
                              )}
                              aria-label={`${valeur} à traiter`}
                            >
                              {valeur}
                            </motion.span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Carte utilisateur */}
      <div className="p-3">
        <div className="bg-sideon flex items-center gap-3 rounded-xl p-3">
          <Avatar utilisateur={utilisateur} taille={34} clair />
          <Link
            to={compte}
            onClick={onNaviguer}
            className="focus-visible:outline-sideav min-w-0 flex-1 rounded outline-none focus-visible:outline-2"
          >
            <span className="text-sidehi block truncate text-[14px] font-semibold hover:underline">
              {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : '…'}
            </span>
            <span className="text-sidemut block truncate text-[12px]">
              {profil === 'GERANT' ? 'Gérant' : 'Chef magasin'}
            </span>
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onDeconnexion}
                aria-label="Se déconnecter"
                className="text-sidetxt hover:bg-side hover:text-sidehi focus-visible:outline-sideav inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-2"
              >
                <LogOut className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Se déconnecter</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
