/*
 * Encart d'alerte : rayon 12 px, padding 12×14 px, fond et texte selon le ton,
 * icône à gauche.
 */
import { motion } from 'motion/react'
import { AlertTriangle, CircleCheck, Info, OctagonX } from 'lucide-react'
import { cn } from '@/lib/utils'

const STYLES = {
  info: { classes: 'bg-ibg text-ifg', icone: Info },
  ok: { classes: 'bg-okbg text-okfg', icone: CircleCheck },
  warn: { classes: 'bg-wbg text-wfg', icone: AlertTriangle },
  danger: { classes: 'bg-dbg text-dfg', icone: OctagonX },
  neutral: { classes: 'bg-surf2 text-ink3 ring-1 ring-line', icone: Info },
}

export function Encart({ ton = 'info', titre, children, icone, action, className, role }) {
  const style = STYLES[ton] ?? STYLES.info
  const Icone = icone ?? style.icone
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      role={role ?? (ton === 'danger' ? 'alert' : 'status')}
      className={cn(
        'flex items-start gap-3 rounded-xl px-3.5 py-3 text-[14px] leading-snug',
        style.classes,
        className,
      )}
    >
      <Icone className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {titre && <p className="font-semibold">{titre}</p>}
        {children && <div className={cn(titre && 'mt-0.5', 'opacity-95')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  )
}
