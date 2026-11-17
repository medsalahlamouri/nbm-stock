/*
 * B8 — Commandes (/gerant/commandes).
 * Onglets Toutes / En attente / Reçues / Annulées (avec compteurs) + recherche.
 * Tableau : n° (CMD-xxx), MP · fournisseur, quantité, montant, date, livraison prévue, état
 * (« En retard · N j »). Action « Annuler » sur les commandes en attente (rpc annuler_commande).
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Ban, ClipboardList, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { annulerCommande } from '@/api/achats'
import { useCommandes } from '@/hooks/useDonnees'
import { correspond, formatDate, formatMontant, formatNombre, reference } from '@/lib/format'
import { etatCommande } from '@/lib/etats'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { BadgeEtat } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable, Reference } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'
import { ConfirmDialog, useConfirmation } from '@/components/commun/Dialogues'

export default function Commandes() {
  const naviguer = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const etat = parametres.get('etat') ?? 'TOUTES'
  const [recherche, setRecherche] = useState('')
  const commandes = useCommandes()
  const confirmation = useConfirmation()

  const annulation = useMutation({
    mutationFn: (id) => annulerCommande(id),
    onSuccess: async (_r, id) => {
      await invalider('achats', 'stock')
      toast.success(`Commande ${reference('CMD', id)} annulée.`)
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const liste = commandes.data ?? []
  const compte = (e) => liste.filter((c) => c.etat === e).length
  const filtrees = liste.filter(
    (c) =>
      (etat === 'TOUTES' || c.etat === etat) &&
      correspond(recherche, reference('CMD', c.id_commande), c.devis?.produit?.designation, c.devis?.produit?.code, c.devis?.fournisseur?.raison_sociale),
  )

  const colonnes = [
    { id: 'ref', entete: 'Commande', tri: (c) => c.id_commande, cellule: (c) => <Reference className="underline underline-offset-2">{reference('CMD', c.id_commande)}</Reference> },
    {
      id: 'mp',
      entete: 'Matière · fournisseur',
      tri: (c) => c.devis?.produit?.designation,
      cellule: (c) => <CellulePrincipale titre={c.devis?.produit?.designation} sousTitre={c.devis?.fournisseur?.raison_sociale} />,
    },
    { id: 'qte', entete: 'Quantité', align: 'right', tri: (c) => c.quantite, cellule: (c) => formatNombre(c.quantite) },
    { id: 'montant', entete: 'Montant', align: 'right', tri: (c) => c.montant, cellule: (c) => formatMontant(c.montant) },
    { id: 'date', entete: 'Date', tri: (c) => c.date_commande, cellule: (c) => formatDate(c.date_commande) },
    { id: 'prevue', entete: 'Livraison prévue', tri: (c) => c.date_prevue, cellule: (c) => (c.etat === 'ANNULEE' ? '—' : formatDate(c.date_prevue)) },
    { id: 'etat', entete: 'État', tri: (c) => c.jours_restants ?? 999, cellule: (c) => <BadgeEtat etat={etatCommande(c)} /> },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (c) =>
        c.etat === 'EN_ATTENTE' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              confirmation.ouvrir(c)
            }}
          >
            <Ban /> Annuler
          </Button>
        ) : null,
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Commandes"
        description="Commandes passées aux fournisseurs. Une commande est en retard quand la date prévue (commande + délai du devis) est dépassée."
        actions={
          <Button asChild>
            <Link to="/gerant/commander">
              <Plus /> Nouvelle commande
            </Link>
          </Button>
        }
      />
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Onglets
            valeur={etat}
            onChange={(v) => setParametres(v === 'TOUTES' ? {} : { etat: v }, { replace: true })}
            libelle="État"
            options={[
              { valeur: 'TOUTES', libelle: 'Toutes', compteur: liste.length },
              { valeur: 'EN_ATTENTE', libelle: 'En attente', compteur: compte('EN_ATTENTE') },
              { valeur: 'RECUE', libelle: 'Reçues', compteur: compte('RECUE') },
              { valeur: 'ANNULEE', libelle: 'Annulées', compteur: compte('ANNULEE') },
            ]}
          />
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="CMD-…, matière, fournisseur" className="sm:w-[320px]" />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtrees}
          cle={(c) => c.id_commande}
          chargement={commandes.isPending}
          erreur={commandes.error}
          onReessayer={commandes.refetch}
          onLigneClick={(c) => naviguer(`/gerant/commandes/${c.id_commande}`)}
          libelleElements="commande(s)"
          vide={
            <EtatVide
              icone={ClipboardList}
              titre={liste.length ? 'Aucune commande pour ce filtre' : 'Aucune commande passée'}
              message={liste.length ? 'Choisissez un autre état ou modifiez la recherche.' : 'Comparez les devis d’une matière première pour passer la première commande.'}
              action={
                <Button asChild>
                  <Link to="/gerant/commander">
                    <Plus /> Nouvelle commande
                  </Link>
                </Button>
              }
            />
          }
        />
      </Carte>
      <ConfirmDialog
        {...confirmation.proprietes}
        titre={`Annuler la commande ${confirmation.cible ? reference('CMD', confirmation.cible.id_commande) : ''} ?`}
        message={
          confirmation.cible
            ? `${formatNombre(confirmation.cible.quantite)} ${confirmation.cible.devis?.produit?.unite ?? ''} de ${confirmation.cible.devis?.produit?.designation} chez ${confirmation.cible.devis?.fournisseur?.raison_sociale}. L'annulation est définitive.`
            : ''
        }
        libelleConfirmer="Annuler la commande"
        onConfirmer={() => annulation.mutateAsync(confirmation.cible.id_commande)}
      />
    </Page>
  )
}
