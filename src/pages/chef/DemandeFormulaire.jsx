/*
 * C9bis — Nouvelle demande / modifier une demande (/chef/demandes/nouvelle, /:id/modifier).
 * Client actif (combobox), canal (onglets Téléphone / Fax / Sur place), date.
 * Lignes dynamiques : article (combobox, articles actifs, un article déjà choisi n'est plus proposé),
 * quantité, prix unitaire repris de la fiche (lecture seule), sous-total, stock disponible (information).
 * rpc('enregistrer_demande') / rpc('modifier_demande'). En modification : client et date verrouillés,
 * annulation possible (rpc annuler_demande).
 */
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion } from 'motion/react'
import { Ban, Check, Info, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  CANAUX,
  annulerDemande,
  enregistrerDemande,
  lireDemande,
  modifierDemande,
} from '@/api/ventes'
import { useClients, useEtatStock } from '@/hooks/useDonnees'
import {
  dateISO,
  formatDate,
  formatMontant,
  formatNombre,
  formatTelephone,
  reference,
} from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Combobox } from '@/components/commun/Combobox'
import { Encart } from '@/components/commun/Encart'
import { Onglets } from '@/components/commun/Onglets'
import { EtatErreur, SqueletteFormulaire } from '@/components/commun/Etats'
import { ZoneDanger } from '@/components/commun/Formulaire'
import { ConfirmDialog } from '@/components/commun/Dialogues'

const schema = z.object({
  id_client: z.coerce
    .number({ message: 'Choisissez un client.' })
    .int()
    .positive('Choisissez un client.'),
  canal: z.enum(['TELEPHONE', 'FAX', 'SUR_PLACE']),
  date: z.string().min(1, 'Saisissez la date.'),
  lignes: z
    .array(
      z.object({
        id_produit: z.coerce
          .number({ message: 'Choisissez un article.' })
          .int()
          .positive('Choisissez un article.'),
        quantite: z.coerce
          .number({ message: 'Quantité invalide.' })
          .int('Nombre entier.')
          .positive('Supérieure à 0.'),
      }),
    )
    .min(1, 'Ajoutez au moins un article.')
    .refine(
      (l) => new Set(l.map((x) => x.id_produit)).size === l.length,
      'Un article ne peut figurer qu’une fois.',
    ),
})

function Formulaire({ demande }) {
  const naviguer = useNavigate()
  const [parametres] = useSearchParams()
  const modification = Boolean(demande)
  const [confirmer, setConfirmer] = useState(false)
  const clients = useClients()
  const stock = useEtatStock()
  const articles = (stock.data ?? []).filter((p) => p.type === 'ARTICLE')
  const parId = Object.fromEntries(articles.map((a) => [a.id_produit, a]))

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id_client:
        demande?.id_client ?? (parametres.get('client') ? Number(parametres.get('client')) : ''),
      canal: demande?.canal ?? 'TELEPHONE',
      date: demande?.date_demande ?? dateISO(),
      lignes: demande?.lignes.map((l) => ({
        id_produit: l.id_produit,
        quantite: String(l.quantite),
      })) ?? [{ id_produit: '', quantite: '1' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' })
  const lignes = useWatch({ control, name: 'lignes' })
  const idClient = useWatch({ control, name: 'id_client' })

  // En modification, le prix d'une ligne existante reste celui enregistré dans la demande
  const prixLigne = (id) => {
    const existante = demande?.lignes.find((l) => l.id_produit === Number(id))
    return existante ? Number(existante.prix_unitaire) : Number(parId[id]?.prix_vente ?? 0)
  }
  const total = (lignes ?? []).reduce(
    (t, l) => t + (Number(l.quantite) > 0 ? Number(l.quantite) * prixLigne(l.id_produit) : 0),
    0,
  )
  const client = (clients.data ?? []).find((c) => c.id_client === Number(idClient))

  const annulation = useMutation({
    mutationFn: () => annulerDemande(demande.id_demande),
    onSuccess: async () => {
      await invalider('ventes')
      toast.success(`Demande ${reference('DEM', demande.id_demande)} annulée.`)
      naviguer('/chef/demandes')
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const soumettre = async (v) => {
    try {
      if (modification) {
        await modifierDemande(demande.id_demande, { canal: v.canal, lignes: v.lignes })
        await invalider('ventes')
        toast.success(`Demande ${reference('DEM', demande.id_demande)} modifiée.`)
      } else {
        const id = await enregistrerDemande({
          idClient: v.id_client,
          canal: v.canal,
          date: v.date,
          lignes: v.lignes,
        })
        await invalider('ventes')
        toast.success(`Demande ${reference('DEM', id)} enregistrée.`, {
          description: `${client?.nom ?? ''} · ${formatMontant(total)}`,
          action: {
            label: 'Facturer',
            onClick: () => naviguer(`/chef/factures-client/nouvelle?demande=${id}`),
          },
        })
      }
      naviguer('/chef/demandes?etat=EN_ATTENTE')
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  const optionsClients = (clients.data ?? [])
    .filter((c) => c.actif || c.id_client === demande?.id_client)
    .map((c) => ({
      valeur: c.id_client,
      libelle: c.nom,
      sousLibelle: c.telephone ? formatTelephone(c.telephone) : reference('CLI', c.id_client),
    }))

  return (
    <Page>
      <PageEntete
        titre={
          modification
            ? `Modifier la demande ${reference('DEM', demande.id_demande)}`
            : 'Nouvelle demande client'
        }
        description={
          modification
            ? `${demande.client?.nom} · reçue le ${formatDate(demande.date_demande)}. Seuls le canal et les articles peuvent être modifiés tant que la demande est en attente.`
            : 'Le prix de chaque article est repris de sa fiche. Le stock est vérifié au moment de la facturation.'
        }
        badges={modification && <Badge ton="warn">En attente</Badge>}
      />
      <div
        className={
          modification ? 'grid items-start gap-[18px] lg:grid-cols-[2fr_minmax(280px,1fr)]' : ''
        }
      >
        <Carte as="form" onSubmit={handleSubmit(soumettre)} noValidate>
          <CarteEntete titre="Demande" />
          <div className="grid gap-x-5 gap-y-4 md:grid-cols-[1.4fr_auto_180px]">
            <Champ
              libelle="Client"
              obligatoire
              erreur={errors.id_client?.message}
              verrouille={modification}
              infoVerrou="Le client ne se modifie pas"
            >
              <Controller
                control={control}
                name="id_client"
                render={({ field }) => (
                  <Combobox
                    valeur={field.value}
                    onChange={field.onChange}
                    options={optionsClients}
                    placeholder="Rechercher un client actif"
                    recherchePlaceholder="Nom ou téléphone…"
                    disabled={modification}
                    invalide={Boolean(errors.id_client)}
                  />
                )}
              />
            </Champ>
            <Champ libelle="Canal">
              <Controller
                control={control}
                name="canal"
                render={({ field }) => (
                  <Onglets
                    libelle="Canal"
                    valeur={field.value}
                    onChange={field.onChange}
                    options={Object.entries(CANAUX).map(([valeur, libelle]) => ({
                      valeur,
                      libelle,
                    }))}
                    className="h-11"
                  />
                )}
              />
            </Champ>
            <Champ
              libelle="Date"
              obligatoire
              erreur={errors.date?.message}
              verrouille={modification}
              infoVerrou="La date ne se modifie pas"
            >
              <Input type="date" max={dateISO()} readOnly={modification} {...register('date')} />
            </Champ>
          </div>

          <div className="border-line overflow-hidden rounded-xl border">
            <div className="bg-surf2 text-mutedtxt hidden grid-cols-[minmax(0,2.4fr)_110px_130px_140px_40px] gap-3 px-4 py-2.5 text-[12px] font-semibold tracking-[0.04em] uppercase md:grid">
              <span>Article</span>
              <span className="text-right">Quantité</span>
              <span className="text-right">Prix unitaire</span>
              <span className="text-right">Sous-total</span>
              <span />
            </div>
            <AnimatePresence initial={false}>
              {fields.map((champ, index) => {
                const ligne = lignes?.[index] ?? {}
                const article = parId[ligne.id_produit]
                const qte = Number(ligne.quantite)
                const dispo = article?.quantite_stock
                const choisis = (lignes ?? [])
                  .map((l, i) => i !== index && Number(l.id_produit))
                  .filter(Boolean)
                const options = articles
                  .filter(
                    (a) =>
                      (a.actif || a.id_produit === Number(ligne.id_produit)) &&
                      !choisis.includes(a.id_produit),
                  )
                  .map((a) => ({
                    valeur: a.id_produit,
                    libelle: a.designation,
                    sousLibelle: a.code,
                    droite: formatMontant(a.prix_vente),
                  }))
                const erreurLigne = errors.lignes?.[index]
                return (
                  <motion.div
                    key={champ.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="border-line3 border-t first:border-t-0 md:first:border-t"
                  >
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3 px-4 py-3 md:grid-cols-[minmax(0,2.4fr)_110px_130px_140px_40px]">
                      <div className="col-span-2 md:col-span-1">
                        <Controller
                          control={control}
                          name={`lignes.${index}.id_produit`}
                          render={({ field }) => (
                            <Combobox
                              libelle={`Article de la ligne ${index + 1}`}
                              valeur={field.value}
                              onChange={field.onChange}
                              options={options}
                              placeholder="Choisir un article"
                              recherchePlaceholder="Code ou désignation…"
                              invalide={Boolean(erreurLigne?.id_produit)}
                            />
                          )}
                        />
                        {article && (
                          <p
                            className={cn(
                              'mt-1 text-[12px]',
                              qte > dispo ? 'text-wfg' : 'text-mutedtxt',
                            )}
                          >
                            Stock disponible : {formatNombre(dispo)} {article.unite}
                            {qte > dispo &&
                              ' · insuffisant pour l’instant (vérifié à la facturation)'}
                          </p>
                        )}
                        {erreurLigne?.id_produit && (
                          <p className="text-dfg mt-1 text-[12px]">
                            {erreurLigne.id_produit.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Input
                          inputMode="numeric"
                          aria-label={`Quantité de la ligne ${index + 1}`}
                          className="text-right"
                          aria-invalid={Boolean(erreurLigne?.quantite) || undefined}
                          {...register(`lignes.${index}.quantite`)}
                        />
                        {erreurLigne?.quantite && (
                          <p className="text-dfg mt-1 text-right text-[12px]">
                            {erreurLigne.quantite.message}
                          </p>
                        )}
                      </div>
                      <p className="text-ink3 tabular flex h-11 items-center justify-end text-[14px]">
                        {article ? formatMontant(prixLigne(ligne.id_produit)) : '—'}
                      </p>
                      <p className="text-ink tabular flex h-11 items-center justify-end text-[14px] font-semibold">
                        {article && qte > 0
                          ? formatMontant(qte * prixLigne(ligne.id_produit))
                          : '—'}
                      </p>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label={`Retirer la ligne ${index + 1}`}
                        className="text-red hover:bg-dbg inline-flex size-11 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div className="border-line bg-surf2 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id_produit: '', quantite: '1' })}
                disabled={fields.length >= articles.filter((a) => a.actif).length}
              >
                <Plus /> Ajouter un article
              </Button>
              <p className="text-mutedtxt text-[15px]">
                Total :{' '}
                <strong className="text-ink tabular text-[18px]">{formatMontant(total)}</strong>
              </p>
            </div>
          </div>
          {errors.lignes?.root?.message || errors.lignes?.message ? (
            <Encart ton="danger">{errors.lignes?.root?.message ?? errors.lignes?.message}</Encart>
          ) : null}
          <Encart ton="info" icone={Info}>
            Paiement comptant : la facture est réputée payée dès son établissement. Le stock de
            chaque article est vérifié à ce moment-là.
          </Encart>
          <div className="border-line flex flex-wrap justify-end gap-2.5 border-t pt-5">
            <Button type="button" variant="outline" onClick={() => naviguer('/chef/demandes')}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
              {modification ? 'Enregistrer les modifications' : 'Enregistrer la demande'}
            </Button>
          </div>
        </Carte>

        {modification && (
          <ZoneDanger
            titre="Annuler la demande"
            action={
              <Button variant="danger" onClick={() => setConfirmer(true)}>
                <Ban /> Annuler la demande
              </Button>
            }
          >
            La demande passera à l'état « Annulée » et ne pourra plus être facturée. Cette action
            est définitive.
          </ZoneDanger>
        )}
      </div>
      {modification && (
        <ConfirmDialog
          ouvert={confirmer}
          onOuvertChange={setConfirmer}
          titre={`Annuler la demande ${reference('DEM', demande.id_demande)} ?`}
          message={`${demande.client?.nom} · ${formatMontant(demande.montant)}. L'annulation est définitive.`}
          libelleConfirmer="Annuler la demande"
          onConfirmer={() => annulation.mutateAsync()}
        />
      )}
    </Page>
  )
}

export default function DemandeFormulaire() {
  const { id } = useParams()
  const requete = useQuery({
    queryKey: ['demande', Number(id)],
    queryFn: () => lireDemande(Number(id)),
    enabled: Boolean(id),
  })
  if (!id) return <Formulaire />
  if (requete.isPending) return <SqueletteFormulaire champs={4} />
  if (requete.isError)
    return (
      <Carte>
        <EtatErreur erreur={requete.error} onReessayer={requete.refetch} />
      </Carte>
    )
  if (requete.data.etat !== 'EN_ATTENTE') {
    return (
      <Carte>
        <Encart ton="warn" titre="Demande non modifiable">
          La demande {reference('DEM', requete.data.id_demande)} est{' '}
          {requete.data.etat === 'FACTUREE' ? 'déjà facturée' : 'annulée'} : elle ne peut plus être
          modifiée.
        </Encart>
      </Carte>
    )
  }
  return <Formulaire key={requete.data.id_demande} demande={requete.data} />
}
