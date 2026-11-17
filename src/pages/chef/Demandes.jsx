/*
 * C9 — Demandes (/chef/demandes).
 * Onglets Toutes / En attente / Facturées / Annulées + recherche.
 * Tableau : n° (DEM-xxx), client, canal, date, nombre d'articles, montant, état.
 * Actions : « Établir la facture » (en attente), modifier, annuler (rpc annuler_demande), ou lien vers la facture.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Ban, FileText, Pencil, Plus, Printer, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { CANAUX, annulerDemande } from '@/api/ventes'
import { useDemandes } from '@/hooks/useDonnees'
import { correspond, formatDate, formatMontant, formatNombre, reference } from '@/lib/format'
import { etatDemande } from '@/lib/etats'
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
import { ActionIcone } from '@/components/commun/ActionIcone'
import { ConfirmDialog, useConfirmation } from '@/components/commun/Dialogues'

export default function Demandes() {
  const naviguer = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const etat = parametres.get('etat') ?? 'TOUTES'
  const [recherche, setRecherche] = useState('')
  const demandes = useDemandes()
  const confirmation = useConfirmation()

  const annulation = useMutation({
    mutationFn: (id) => annulerDemande(id),
    onSuccess: async (_r, id) => {
      await invalider('ventes')
      toast.success(`Demande ${reference('DEM', id)} annulée.`)
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const liste = demandes.data ?? []
  const compte = (e) => liste.filter((d) => d.etat === e).length
  const filtrees = liste.filter(
    (d) => (etat === 'TOUTES' || d.etat === etat) && correspond(recherche, reference('DEM', d.id_demande), d.client?.nom, d.facture?.numero, ...d.lignes.map((l) => l.produit?.designation)),
  )

  const colonnes = [
    { id: 'ref', entete: 'Demande', tri: (d) => d.id_demande, cellule: (d) => <Reference>{reference('DEM', d.id_demande)}</Reference> },
    {
      id: 'client',
      entete: 'Client',
      tri: (d) => d.client?.nom,
      cellule: (d) => <CellulePrincipale titre={d.client?.nom} sousTitre={d.lignes.map((l) => l.produit?.designation).join(', ')} />,
      classe: 'max-w-[320px]',
    },
    { id: 'canal', entete: 'Canal', tri: (d) => d.canal, cellule: (d) => CANAUX[d.canal] ?? d.canal },
    { id: 'date', entete: 'Date', tri: (d) => d.date_demande, cellule: (d) => formatDate(d.date_demande) },
    { id: 'articles', entete: 'Articles', align: 'right', tri: (d) => d.nb_articles, cellule: (d) => formatNombre(d.nb_articles) },
    { id: 'montant', entete: 'Montant', align: 'right', tri: (d) => d.montant, cellule: (d) => <strong>{formatMontant(d.montant)}</strong> },
    { id: 'etat', entete: 'État', tri: (d) => d.etat, cellule: (d) => <BadgeEtat etat={etatDemande(d.etat)} /> },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (d) => (
        <div className="flex items-center justify-end gap-1">
          {d.etat === 'EN_ATTENTE' && (
            <>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  naviguer(`/chef/factures-client/nouvelle?demande=${d.id_demande}`)
                }}
              >
                <Receipt /> Établir la facture
              </Button>
              <ActionIcone libelle="Modifier" icone={Pencil} to={`/chef/demandes/${d.id_demande}/modifier`} />
              <ActionIcone libelle="Annuler la demande" icone={Ban} ton="danger" onClick={() => confirmation.ouvrir(d)} />
            </>
          )}
          {d.facture && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/chef/factures-client/${d.facture.id_facture_c}/imprimer`} onClick={(e) => e.stopPropagation()}>
                <Printer /> {d.facture.numero}
              </Link>
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Demandes"
        description="Les demandes des clients (téléphone, fax ou sur place). Une demande en attente peut être modifiée, annulée ou facturée."
        actions={
          <Button asChild>
            <Link to="/chef/demandes/nouvelle">
              <Plus /> Nouvelle demande
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
              { valeur: 'FACTUREE', libelle: 'Facturées', compteur: compte('FACTUREE') },
              { valeur: 'ANNULEE', libelle: 'Annulées', compteur: compte('ANNULEE') },
            ]}
          />
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="DEM-…, client, article" className="sm:w-[300px]" />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtrees}
          cle={(d) => d.id_demande}
          chargement={demandes.isPending}
          erreur={demandes.error}
          onReessayer={demandes.refetch}
          onLigneClick={(d) => d.etat === 'EN_ATTENTE' && naviguer(`/chef/demandes/${d.id_demande}/modifier`)}
          libelleElements="demande(s)"
          vide={
            <EtatVide
              icone={FileText}
              titre={liste.length ? 'Aucune demande pour ce filtre' : 'Aucune demande enregistrée'}
              message={liste.length ? 'Choisissez un autre état ou modifiez la recherche.' : 'Enregistrez la première demande d’un client.'}
              action={
                <Button asChild>
                  <Link to="/chef/demandes/nouvelle">
                    <Plus /> Nouvelle demande
                  </Link>
                </Button>
              }
            />
          }
        />
      </Carte>
      <ConfirmDialog
        {...confirmation.proprietes}
        titre={`Annuler la demande ${confirmation.cible ? reference('DEM', confirmation.cible.id_demande) : ''} ?`}
        message={confirmation.cible ? `${confirmation.cible.client?.nom} · ${formatMontant(confirmation.cible.montant)}. L'annulation est définitive.` : ''}
        libelleConfirmer="Annuler la demande"
        onConfirmer={() => annulation.mutateAsync(confirmation.cible.id_demande)}
      />
    </Page>
  )
}
