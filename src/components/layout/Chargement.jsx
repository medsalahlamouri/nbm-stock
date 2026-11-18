/*
 * Indicateurs de chargement : page en cours de chargement (squelette) et écran de démarrage.
 */
import { motion } from 'motion/react'
import { Skeleton } from '@/components/ui/skeleton'
import { Logo } from '@/components/commun/Logo'

/** Squelette affiché pendant le chargement différé d'une page */
export function ChargementPage() {
  return (
    <div className="flex flex-col gap-[22px]" aria-busy="true" aria-label="Chargement de la page">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-[14px]" />
        ))}
      </div>
      <Skeleton className="h-[360px] rounded-[14px]" />
    </div>
  )
}

/** Écran de démarrage pendant la lecture de la session */
export function EcranDemarrage() {
  return (
    <div
      className="bg-bg flex min-h-svh items-center justify-center"
      aria-busy="true"
      aria-label="Chargement"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ opacity: [1, 0.55, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <Logo taille={56} inverse />
        </motion.div>
        <p className="text-mutedtxt text-[13px]">Chargement de NBM Stock…</p>
      </motion.div>
    </div>
  )
}
