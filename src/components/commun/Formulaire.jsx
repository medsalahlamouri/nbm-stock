/*
 * Éléments communs aux formulaires d'ajout et de modification (maquettes 4b, 4d, 5c, 10d…).
 * - PiedFormulaire : statut « Aucune modification / N champ(s) modifié(s) », Annuler, Enregistrer.
 * - ZoneDanger : carte « Désactiver / Supprimer » à bordure rouge.
 * - FicheResume : carte « Fiche » (identifiant, compteurs, lien vers la fiche complète).
 */
import { Link } from 'react-router'
import { Check, Eye, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/commun/Badge'
import { Carte, CarteEntete, LigneInfo } from '@/components/commun/Carte'

export function PiedFormulaire({
  modification = false,
  nbModifies = 0,
  enCours,
  onAnnuler,
  libelle,
  desactive,
}) {
  const texte = libelle ?? (modification ? 'Enregistrer les modifications' : 'Enregistrer')
  return (
    <div className="border-line mt-2 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
      <div>
        {modification && (
          <Badge ton={nbModifies > 0 ? 'gold' : 'neutral'}>
            {nbModifies > 0 ? `${nbModifies} champ(s) modifié(s)` : 'Aucune modification'}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button type="button" variant="outline" onClick={onAnnuler} disabled={enCours}>
          Annuler
        </Button>
        <Button type="submit" disabled={enCours || desactive || (modification && nbModifies === 0)}>
          {enCours ? <Loader2 className="animate-spin" /> : <Check />}
          {texte}
        </Button>
      </div>
    </div>
  )
}

export function ZoneDanger({ titre, children, action, className }) {
  return (
    <Carte className={cn('border-dline', className)}>
      <CarteEntete titre={titre} />
      <div className="text-mutedtxt text-[14px] leading-relaxed">{children}</div>
      {action && <div>{action}</div>}
    </Carte>
  )
}

export function FicheResume({ lignes, lien }) {
  return (
    <Carte>
      <CarteEntete titre="Fiche" />
      <dl>
        {lignes.map(([libelle, valeur]) => (
          <LigneInfo key={libelle} libelle={libelle} fort>
            {valeur}
          </LigneInfo>
        ))}
      </dl>
      {lien && (
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link to={lien}>
              <Eye /> Voir la fiche complète
            </Link>
          </Button>
        </div>
      )}
    </Carte>
  )
}

/** Nombre de champs dont la valeur diffère de la valeur initiale */
// oxlint-disable-next-line react/only-export-components
export function compterModifies(dirtyFields) {
  return Object.values(dirtyFields ?? {}).filter(Boolean).length
}
