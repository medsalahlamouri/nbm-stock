/*
 * Champ mot de passe avec bouton œil (afficher / masquer) et règles de robustesse vérifiées en direct.
 */
import { forwardRef, useState } from 'react'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { REGLES_MOT_DE_PASSE } from '@/lib/schemas'

export const ChampMotDePasse = forwardRef(function ChampMotDePasse({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} className={cn('h-[46px] pr-11', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-mutedtxt transition-colors hover:bg-surf2 hover:text-ink"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  )
})

/** Indicateurs ✓ / ✗ mis à jour à chaque frappe */
export function ReglesMotDePasse({ valeur }) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2" aria-label="Règles du mot de passe">
      {REGLES_MOT_DE_PASSE.map((regle) => {
        const ok = regle.test(valeur ?? '')
        return (
          <li key={regle.libelle} className={cn('flex items-center gap-2 text-[13px] transition-colors', ok ? 'text-okfg' : 'text-mutedtxt')}>
            <span
              className={cn(
                'inline-flex size-[18px] shrink-0 items-center justify-center rounded-full transition-colors',
                ok ? 'bg-okfg text-surf' : 'bg-nbg text-muted2',
              )}
              aria-hidden="true"
            >
              {ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
            </span>
            {regle.libelle}
            <span className="sr-only">{ok ? ' : respecté' : ' : non respecté'}</span>
          </li>
        )
      })}
    </ul>
  )
}
