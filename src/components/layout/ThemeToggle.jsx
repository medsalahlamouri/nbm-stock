/*
 * Bouton lune / soleil de l'en-tête : bascule entre thème clair et sombre (choix mémorisé).
 */
import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/layout/ThemeProvider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ThemeToggle({ className }) {
  const { theme, basculer } = useTheme()
  const sombre = theme === 'dark'
  const libelle = sombre ? 'Passer au thème clair' : 'Passer au thème sombre'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={basculer}
          aria-label={libelle}
          className={
            className ??
            'inline-flex size-[38px] cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border border-line bg-surf text-ink transition-colors hover:bg-surf2 active:scale-95'
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -60, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 60, opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              className="inline-flex"
            >
              {sombre ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent>{libelle}</TooltipContent>
    </Tooltip>
  )
}
