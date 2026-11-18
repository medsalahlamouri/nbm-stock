/*
 * Suppression d'un fournisseur, d'un client ou d'un produit :
 * rpc('supprimer_ou_desactiver') supprime l'élément s'il n'a aucune donnée liée, sinon le désactive.
 * Le résultat est annoncé clairement ; la réactivation remet actif = true.
 */
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reactiver, supprimerOuDesactiver } from '@/api/stock'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'

const NOMS = {
  fournisseur: { nom: 'Fournisseur', domaine: 'achats' },
  client: { nom: 'Client', domaine: 'ventes' },
  produit: { nom: 'Produit', domaine: 'stock' },
}

export function useSuppression(objet, { onSupprime } = {}) {
  const { nom, domaine } = NOMS[objet]

  const suppression = useMutation({
    mutationFn: (id) => supprimerOuDesactiver(objet, id),
    onSuccess: async (resultat) => {
      await invalider(domaine)
      if (resultat === 'SUPPRIME') {
        toast.success(`${nom} supprimé.`)
        onSupprime?.()
      } else {
        toast.info(`${nom} désactivé car il a des données liées.`, {
          description: 'Il reste consultable avec le filtre « Inactifs » et peut être réactivé.',
        })
      }
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const reactivation = useMutation({
    mutationFn: (id) => reactiver(objet, id),
    onSuccess: async () => {
      await invalider(domaine)
      toast.success(`${nom} réactivé.`)
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  return { suppression, reactivation }
}
