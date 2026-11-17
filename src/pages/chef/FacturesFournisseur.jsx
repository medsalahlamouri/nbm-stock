/*
 * C7 — Factures fournisseur (/chef/factures-fournisseur).
 * En haut : commandes à réceptionner (EN_ATTENTE) en cartes cliquables, avec badge de retard.
 * Tableau des factures saisies : n°, commande, MP, fournisseur, date, quantité, montant.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Inbox, PackageCheck } from 'lucide-react'
import { listerFacturesFournisseur } from '@/api/achats'
import { useCommandes } from '@/hooks/useDonnees'
import { correspond, formatDate, formatMontant, formatNombre, reference } from '@/lib/format'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete } from '@/components/commun/Carte'
import { CellulePrincipale, DataTable, Reference } from '@/components/commun/DataTable'
import { EtatErreur, EtatVide } from '@/components/commun/Etats'
import { Recherche } from '@/components/commun/Recherche'
import { Skeleton } from '@/components/ui/skeleton'
import { listeCascade } from '@/components/commun/animations'
import { CarteCommande } from '@/components/commun/CarteCommande'

export default function FacturesFournisseur() {
  const [recherche, setRecherche] = useState('')
  const factures = useQuery({ queryKey: ['factures-fournisseur'], queryFn: listerFacturesFournisseur })
  const commandes = useCommandes()
  const aReceptionner = (commandes.data ?? []).filter((c) => c.etat === 'EN_ATTENTE').sort((a, b) => a.jours_restants - b.jours_restants)
  const liste = (factures.data ?? []).filter((f) =>
    correspond(recherche, f.numero, reference('CMD', f.id_commande), f.commande_fournisseur?.devis?.produit?.designation, f.commande_fournisseur?.devis?.fournisseur?.raison_sociale),
  )

  const colonnes = [
    { id: 'numero', entete: 'N° facture', tri: (f) => f.numero, cellule: (f) => <Reference>{f.numero}</Reference> },
    { id: 'commande', entete: 'Commande', tri: (f) => f.id_commande, cellule: (f) => <span className="font-mono text-[13px]">{reference('CMD', f.id_commande)}</span> },
    {
      id: 'mp',
      entete: 'Matière · fournisseur',
      tri: (f) => f.commande_fournisseur?.devis?.produit?.designation,
      cellule: (f) => <CellulePrincipale titre={f.commande_fournisseur?.devis?.produit?.designation} sousTitre={f.commande_fournisseur?.devis?.fournisseur?.raison_sociale} />,
    },
    { id: 'date', entete: 'Date', tri: (f) => f.date_facture, cellule: (f) => formatDate(f.date_facture) },
    {
      id: 'qte',
      entete: 'Quantité',
      align: 'right',
      tri: (f) => f.quantite,
      cellule: (f) => (
        <>
          {formatNombre(f.quantite)} <span className="text-mutedtxt">{f.commande_fournisseur?.devis?.produit?.unite}</span>
        </>
      ),
    },
    { id: 'pu', entete: 'Prix unitaire', align: 'right', tri: (f) => Number(f.prix_unitaire), cellule: (f) => formatMontant(f.prix_unitaire) },
    { id: 'montant', entete: 'Montant', align: 'right', tri: (f) => Number(f.montant_total), cellule: (f) => <strong>{formatMontant(f.montant_total)}</strong> },
  ]

  return (
    <Page>
      <PageEntete
        titre="Factures fournisseur"
        description="À la livraison, recopiez la facture du fournisseur : elle est contrôlée par rapport à la commande, puis le stock est mis à jour automatiquement."
      />
      <Carte>
        <CarteEntete
          titre="Commandes à réceptionner"
          description={aReceptionner.length ? `${formatNombre(aReceptionner.length)} commande(s) en attente de livraison · cliquez pour saisir la facture` : 'Aucune commande en attente'}
          icone={<Inbox className="mt-0.5 size-5 text-gold2" aria-hidden="true" />}
        />
        {commandes.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[118px] rounded-xl" />
            ))}
          </div>
        ) : commandes.isError ? (
          <EtatErreur erreur={commandes.error} onReessayer={commandes.refetch} />
        ) : aReceptionner.length === 0 ? (
          <EtatVide icone={PackageCheck} titre="Tout est réceptionné" message="Les commandes passées par le gérant apparaîtront ici en attendant leur livraison." compact />
        ) : (
          <motion.div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" {...listeCascade}>
            {aReceptionner.map((c) => (
              <CarteCommande key={c.id_commande} commande={c} to={`/chef/factures-fournisseur/nouvelle?commande=${c.id_commande}`} />
            ))}
          </motion.div>
        )}
      </Carte>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <CarteEntete titre="Factures saisies" description="Chaque facture conforme a clôturé sa commande et créé un mouvement « Réception fournisseur »." />
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="N°, commande, matière, fournisseur" className="sm:w-[320px]" />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={liste}
          cle={(f) => f.id_facture_f}
          chargement={factures.isPending}
          erreur={factures.error}
          onReessayer={factures.refetch}
          libelleElements="facture(s)"
          vide={
            <EtatVide
              icone={Inbox}
              titre={factures.data?.length ? 'Aucune facture ne correspond' : 'Aucune facture saisie'}
              message={factures.data?.length ? 'Modifiez la recherche.' : 'Choisissez une commande livrée ci-dessus pour saisir sa facture.'}
              compact
            />
          }
        />
      </Carte>
    </Page>
  )
}
