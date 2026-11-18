/*
 * Actions du gérant sur les comptes chef magasin (Edge Function gerer-comptes) :
 * réinitialiser le mot de passe, supprimer ou désactiver, réactiver.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  reactiverCompte,
  reinitialiserMotDePasse,
  supprimerOuDesactiverCompte,
} from '@/api/utilisateurs'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'

export function useComptes({ onSupprime } = {}) {
  // Mot de passe provisoire à afficher une seule fois : { motDePasse, personne }
  const [provisoire, setProvisoire] = useState(null)
  const nom = (u) => `${u.prenom} ${u.nom}`

  const reinitialisation = useMutation({
    mutationFn: (u) => reinitialiserMotDePasse(u.id_utilisateur),
    onSuccess: async (r, u) => {
      await invalider('comptes')
      setProvisoire({ motDePasse: r.mot_de_passe_provisoire, personne: nom(u) })
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const suppression = useMutation({
    mutationFn: (u) => supprimerOuDesactiverCompte(u.id_utilisateur),
    onSuccess: async (r, u) => {
      await invalider('comptes')
      if (r?.resultat === 'SUPPRIME') {
        toast.success(`Compte de ${nom(u)} supprimé.`)
        onSupprime?.()
      } else {
        toast.info(`Compte de ${nom(u)} désactivé car il a des données liées.`, {
          description: 'La personne ne peut plus se connecter ; son historique est conservé.',
        })
      }
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const reactivation = useMutation({
    mutationFn: (u) => reactiverCompte(u.id_utilisateur),
    onSuccess: async (_r, u) => {
      await invalider('comptes')
      toast.success(`Compte de ${nom(u)} réactivé.`)
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  return {
    reinitialisation,
    suppression,
    reactivation,
    provisoire,
    fermerProvisoire: () => setProvisoire(null),
  }
}
