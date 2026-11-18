/*
 * B8bis — Détail d'une commande (/gerant/commandes/:id).
 * Récapitulatif (MP, fournisseur, devis, quantité, prix, montant, dates), frise d'avancement
 * (Commande passée → Livraison prévue → Facture reçue, ou Annulée), bloc facture si reçue,
 * bouton « Annuler la commande » si en attente (rpc annuler_commande).
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Ban, Check, Clock, PackageCheck, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { annulerCommande, lireCommande } from '@/api/achats'
import { formatDate, formatMontant, formatNombre, formatTelephone, reference } from '@/lib/format'
import { etatCommande } from '@/lib/etats'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { cn } from '@/lib/utils'
import { useFilAriane } from '@/components/layout/FilAriane'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, LigneInfo } from '@/components/commun/Carte'
import { BadgeEtat } from '@/components/commun/Badge'
import { Encart } from '@/components/commun/Encart'
import { EtatErreur, SqueletteBloc } from '@/components/commun/Etats'
import { ConfirmDialog } from '@/components/commun/Dialogues'

function Frise({ commande }) {
  const annulee = commande.etat === 'ANNULEE'
  const recue = commande.etat === 'RECUE'
  const retard = commande.etat === 'EN_ATTENTE' && commande.jours_restants < 0
  const etapes = [
    {
      titre: 'Commande passée',
      detail: formatDate(commande.date_commande),
      icone: Check,
      statut: 'fait',
    },
    {
      titre: 'Livraison prévue',
      detail: `${formatDate(commande.date_prevue)}${retard ? ` · retard de ${Math.abs(commande.jours_restants)} j` : ''}`,
      icone: retard ? Clock : Truck,
      statut: annulee ? 'neutre' : recue ? 'fait' : retard ? 'retard' : 'encours',
    },
    annulee
      ? {
          titre: 'Commande annulée',
          detail: 'Aucune livraison attendue',
          icone: X,
          statut: 'annule',
        }
      : {
          titre: 'Facture reçue',
          detail: recue
            ? `${commande.facture?.numero ?? ''} · ${formatDate(commande.facture?.date_facture)}`
            : 'En attente de la facture',
          icone: PackageCheck,
          statut: recue ? 'fait' : 'attente',
        },
  ]
  const styles = {
    fait: 'bg-okfg text-surf',
    encours: 'bg-ibg text-ifg ring-2 ring-ifg/30',
    retard: 'bg-dbg text-dfg ring-2 ring-dfg/30',
    attente: 'bg-nbg text-muted2',
    neutre: 'bg-nbg text-muted2',
    annule: 'bg-nbg text-nfg',
  }
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {etapes.map((etape, i) => (
        <motion.li
          key={etape.titre}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.2 }}
          className="relative flex items-start gap-3"
        >
          {i < etapes.length - 1 && (
            <span
              className="bg-line absolute top-[17px] left-[44px] hidden h-0.5 w-[calc(100%-36px)] sm:block"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              'relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full',
              styles[etape.statut],
            )}
          >
            <etape.icone className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-ink text-[14px] font-semibold">{etape.titre}</p>
            <p
              className={cn(
                'text-[13px]',
                etape.statut === 'retard' ? 'text-dfg font-medium' : 'text-mutedtxt',
              )}
            >
              {etape.detail}
            </p>
          </div>
        </motion.li>
      ))}
    </ol>
  )
}

export default function CommandeDetail() {
  const { id } = useParams()
  const idC = Number(id)
  const [confirmer, setConfirmer] = useState(false)
  const requete = useQuery({ queryKey: ['commande', idC], queryFn: () => lireCommande(idC) })
  useFilAriane(reference('CMD', idC))

  const annulation = useMutation({
    mutationFn: () => annulerCommande(idC),
    onSuccess: async () => {
      await invalider('achats', 'stock')
      toast.success(`Commande ${reference('CMD', idC)} annulée.`)
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  if (requete.isPending)
    return (
      <Page>
        <SqueletteBloc hauteur={100} />
        <SqueletteBloc hauteur={220} />
      </Page>
    )
  if (requete.isError)
    return (
      <Carte>
        <EtatErreur erreur={requete.error} onReessayer={requete.refetch} />
      </Carte>
    )
  const c = requete.data
  const p = c.devis?.produit
  const f = c.devis?.fournisseur
  const etat = etatCommande(c)

  return (
    <Page>
      <PageEntete
        titre={`Commande ${reference('CMD', c.id_commande)}`}
        description={`${p?.designation} · ${f?.raison_sociale} · passée le ${formatDate(c.date_commande)}`}
        badges={<BadgeEtat etat={etat} />}
        actions={
          c.etat === 'EN_ATTENTE' && (
            <Button variant="danger" onClick={() => setConfirmer(true)}>
              <Ban /> Annuler la commande
            </Button>
          )
        }
      />

      <Carte>
        <CarteEntete
          titre="Avancement"
          description="Livraison prévue = date de commande + délai du devis"
        />
        <Frise commande={c} />
        {c.etat === 'EN_ATTENTE' && c.jours_restants < 0 && (
          <Encart
            ton="danger"
            titre={`Livraison en retard de ${Math.abs(c.jours_restants)} jour(s)`}
          >
            Relancez {f?.raison_sociale}
            {f?.telephone ? ` au ${formatTelephone(f.telephone)}` : ''}
            {f?.email ? ` ou par e-mail (${f.email})` : ''}. La commande sera clôturée à la saisie
            de la facture par le chef magasin.
          </Encart>
        )}
      </Carte>

      <div className="grid items-start gap-[18px] lg:grid-cols-2">
        <Carte>
          <CarteEntete titre="Récapitulatif" />
          <dl>
            <LigneInfo libelle="Matière première">
              {p?.designation} <span className="text-mutedtxt">· {p?.code}</span>
            </LigneInfo>
            <LigneInfo libelle="Fournisseur">
              <Link
                to={`/gerant/fournisseurs/${f?.id_fournisseur}`}
                className="underline underline-offset-2"
              >
                {f?.raison_sociale}
              </Link>
            </LigneInfo>
            <LigneInfo libelle="Devis">
              <Link
                to={`/gerant/devis/${c.devis?.id_devis}/modifier`}
                className="font-mono underline underline-offset-2"
              >
                {reference('DEV', c.devis?.id_devis)}
              </Link>{' '}
              du {formatDate(c.devis?.date_devis)}
            </LigneInfo>
            <LigneInfo libelle="Quantité">
              {formatNombre(c.quantite)} {p?.unite}
            </LigneInfo>
            <LigneInfo libelle="Prix unitaire">{formatMontant(c.devis?.prix_unitaire)}</LigneInfo>
            <LigneInfo libelle="Délai annoncé">{c.devis?.delai_livraison} jour(s)</LigneInfo>
            <LigneInfo libelle="Date de commande">{formatDate(c.date_commande)}</LigneInfo>
            <LigneInfo libelle="Livraison prévue">
              {c.etat === 'ANNULEE' ? '—' : formatDate(c.date_prevue)}
            </LigneInfo>
            <LigneInfo libelle="Montant" fort className="border-line mt-1 border-t pt-3">
              {formatMontant(c.montant)}
            </LigneInfo>
          </dl>
        </Carte>

        <Carte>
          <CarteEntete
            titre="Facture fournisseur"
            description="Saisie et contrôlée par le chef magasin à la réception"
          />
          {c.facture ? (
            <dl>
              <LigneInfo libelle="Numéro">
                <span className="font-mono font-semibold">{c.facture.numero}</span>
              </LigneInfo>
              <LigneInfo libelle="Date de la facture">
                {formatDate(c.facture.date_facture)}
              </LigneInfo>
              <LigneInfo libelle="Délai réel">
                {Math.round(
                  (new Date(c.facture.date_facture) - new Date(c.date_commande)) / 86_400_000,
                )}{' '}
                jour(s)
              </LigneInfo>
              <LigneInfo libelle="Quantité reçue">
                {formatNombre(c.facture.quantite)} {p?.unite}
              </LigneInfo>
              <LigneInfo libelle="Prix unitaire">
                {formatMontant(c.facture.prix_unitaire)}
              </LigneInfo>
              <LigneInfo libelle="Montant total" fort className="border-line mt-1 border-t pt-3">
                {formatMontant(c.facture.montant_total)}
              </LigneInfo>
            </dl>
          ) : (
            <Encart ton={c.etat === 'ANNULEE' ? 'neutral' : 'info'}>
              {c.etat === 'ANNULEE'
                ? 'Commande annulée : aucune facture ne sera saisie.'
                : 'Aucune facture pour l’instant. Le stock sera mis à jour automatiquement quand le chef magasin saisira la facture conforme.'}
            </Encart>
          )}
        </Carte>
      </div>

      <ConfirmDialog
        ouvert={confirmer}
        onOuvertChange={setConfirmer}
        titre={`Annuler la commande ${reference('CMD', c.id_commande)} ?`}
        message={`${formatNombre(c.quantite)} ${p?.unite ?? ''} de ${p?.designation} chez ${f?.raison_sociale}. L'annulation est définitive.`}
        libelleConfirmer="Annuler la commande"
        onConfirmer={() => annulation.mutateAsync()}
      />
    </Page>
  )
}
