/*
 * Fenêtre de confirmation : avant toute suppression, désactivation,
 * annulation ou validation d'inventaire. Construite sur AlertDialog de shadcn/ui.
 * Le bouton de confirmation affiche un état de chargement pendant l'action ; la fenêtre se ferme
 * seulement si l'action réussit.
 */
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  ouvert,
  onOuvertChange,
  titre,
  message,
  children,
  libelleConfirmer = 'Confirmer',
  libelleAnnuler = 'Retour',
  ton = 'danger',
  onConfirmer,
}) {
  const [enCours, setEnCours] = useState(false)

  const confirmer = async () => {
    setEnCours(true)
    try {
      await onConfirmer()
      onOuvertChange(false)
    } catch {
      // l'erreur est affichée par l'appelant (toast) ; la fenêtre reste ouverte
    } finally {
      setEnCours(false)
    }
  }

  return (
    <AlertDialog open={ouvert} onOpenChange={(o) => !enCours && onOuvertChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          {message && <AlertDialogDescription>{message}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={enCours}>
              {libelleAnnuler}
            </Button>
          </AlertDialogCancel>
          <Button
            variant={ton === 'danger' ? 'destructive' : 'default'}
            onClick={confirmer}
            disabled={enCours}
          >
            {enCours && <Loader2 className="animate-spin" />}
            {libelleConfirmer}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Hook pratique : gère l'ouverture d'une confirmation pour un élément donné */
// oxlint-disable-next-line react/only-export-components
export function useConfirmation() {
  const [cible, setCible] = useState(null)
  return {
    cible,
    ouvrir: (element) => setCible(element),
    proprietes: { ouvert: cible !== null, onOuvertChange: (o) => !o && setCible(null) },
  }
}
