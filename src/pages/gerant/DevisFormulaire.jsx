/*
 * B6bis — Ajouter / modifier un devis (/gerant/devis/nouveau, /:id/modifier).
 * Fournisseur actif (combobox), matière première active (combobox, MP uniquement), date,
 * prix unitaire > 0, délai entier ≥ 0. Encart calculé : « Montant estimé pour Q* = … DT ».
 * Un devis utilisé dans une commande s'ouvre en lecture seule (RG09).
 */
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calculator, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { creerDevis, lireDevis, modifierDevis, supprimerDevis } from '@/api/achats'
import { useEtatStock, useFournisseurs } from '@/hooks/useDonnees'
import { dateISO, formatDate, formatMontant, formatNombre, reference } from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { nombre } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Combobox } from '@/components/commun/Combobox'
import { Encart } from '@/components/commun/Encart'
import { EtatErreur, SqueletteFormulaire } from '@/components/commun/Etats'
import {
  FicheResume,
  PiedFormulaire,
  ZoneDanger,
  compterModifies,
} from '@/components/commun/Formulaire'
import { ConfirmDialog } from '@/components/commun/Dialogues'

const schema = z.object({
  id_fournisseur: z.coerce
    .number({ message: 'Choisissez un fournisseur.' })
    .int()
    .positive('Choisissez un fournisseur.'),
  id_produit: z.coerce
    .number({ message: 'Choisissez une matière première.' })
    .int()
    .positive('Choisissez une matière première.'),
  date_devis: z
    .string()
    .min(1, 'Saisissez la date du devis.')
    .refine((v) => new Date(v) <= new Date(), 'La date ne peut pas être dans le futur.'),
  prix_unitaire: nombre('Saisissez le prix unitaire.').refine(
    (v) => v > 0,
    'Le prix unitaire doit être supérieur à 0.',
  ),
  delai_livraison: nombre('Saisissez le délai.').refine(
    (v) => Number.isInteger(v) && v >= 0,
    'Le délai est un nombre entier de jours, 0 ou plus.',
  ),
})

function Formulaire({ devis }) {
  const naviguer = useNavigate()
  const [parametres] = useSearchParams()
  const modification = Boolean(devis)
  const verrouille = Boolean(devis?.utilise)
  const [confirmer, setConfirmer] = useState(false)
  const fournisseurs = useFournisseurs()
  const stock = useEtatStock()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id_fournisseur:
        devis?.id_fournisseur ??
        (parametres.get('fournisseur') ? Number(parametres.get('fournisseur')) : ''),
      id_produit:
        devis?.id_produit ?? (parametres.get('produit') ? Number(parametres.get('produit')) : ''),
      date_devis: devis?.date_devis ?? dateISO(),
      prix_unitaire: devis ? String(devis.prix_unitaire) : '',
      delai_livraison: devis ? String(devis.delai_livraison) : '',
    },
  })
  const [idProduit, prix] = useWatch({ control, name: ['id_produit', 'prix_unitaire'] })
  const matiere = (stock.data ?? []).find((p) => p.id_produit === Number(idProduit))
  const prixNombre = Number(String(prix ?? '').replace(',', '.'))
  const montantQ =
    matiere?.quantite_economique && prixNombre > 0 ? matiere.quantite_economique * prixNombre : null

  const optionsFournisseurs = (fournisseurs.data ?? [])
    .filter((f) => f.actif || f.id_fournisseur === devis?.id_fournisseur)
    .map((f) => ({
      valeur: f.id_fournisseur,
      libelle: f.raison_sociale,
      sousLibelle: reference('FRN', f.id_fournisseur),
    }))
  const optionsMP = (stock.data ?? [])
    .filter((p) => p.type === 'MP' && (p.actif || p.id_produit === devis?.id_produit))
    .map((p) => ({
      valeur: p.id_produit,
      libelle: p.designation,
      sousLibelle: p.code,
      droite: p.quantite_economique ? `Q* ${formatNombre(p.quantite_economique)}` : null,
    }))

  const suppression = useMutation({
    mutationFn: () => supprimerDevis(devis.id_devis),
    onSuccess: async () => {
      await invalider('achats')
      toast.success('Devis supprimé.')
      naviguer('/gerant/devis')
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const soumettre = async (valeurs) => {
    try {
      if (modification) await modifierDevis(devis.id_devis, valeurs)
      else await creerDevis(valeurs)
      await invalider('achats')
      toast.success(modification ? 'Devis modifié.' : 'Devis enregistré.')
      naviguer(`/gerant/devis?produit=${valeurs.id_produit}`)
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  const titre = verrouille ? 'Devis utilisé' : modification ? 'Modifier le devis' : 'Nouveau devis'

  return (
    <Page>
      <PageEntete
        titre={titre}
        description={
          modification ? (
            <>
              <span className="font-mono">{reference('DEV', devis.id_devis)}</span>
              {verrouille
                ? ' · consultation seule'
                : ' · les champs modifiés sont signalés en doré.'}
            </>
          ) : (
            'Prix et délai proposés par un fournisseur pour une matière première.'
          )
        }
        badges={
          modification && (
            <Badge ton={verrouille ? 'neutral' : 'dark'} icone={verrouille ? Lock : undefined}>
              {verrouille ? 'Verrouillé' : 'Modification'}
            </Badge>
          )
        }
      />
      <div
        className={
          modification
            ? 'grid items-start gap-[18px] lg:grid-cols-[2fr_minmax(280px,1fr)]'
            : 'max-w-3xl'
        }
      >
        <Carte as="form" onSubmit={handleSubmit(soumettre)} noValidate>
          <CarteEntete titre="Devis" description="Tous les champs sont obligatoires." />
          {verrouille && (
            <Encart ton="info" icone={Lock} titre="Devis utilisé dans une commande">
              Il ne peut plus être modifié ni supprimé, afin que la commande reste cohérente avec le
              devis accepté (règle RG09).
            </Encart>
          )}
          <fieldset disabled={verrouille} className="flex flex-col gap-4">
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Champ
                libelle="Fournisseur"
                obligatoire
                erreur={errors.id_fournisseur?.message}
                modifie={dirtyFields.id_fournisseur}
              >
                <Controller
                  control={control}
                  name="id_fournisseur"
                  render={({ field }) => (
                    <Combobox
                      valeur={field.value}
                      onChange={field.onChange}
                      options={optionsFournisseurs}
                      placeholder="Choisir un fournisseur actif"
                      recherchePlaceholder="Rechercher un fournisseur…"
                      disabled={verrouille}
                      invalide={Boolean(errors.id_fournisseur)}
                    />
                  )}
                />
              </Champ>
              <Champ
                libelle="Matière première"
                obligatoire
                erreur={errors.id_produit?.message}
                modifie={dirtyFields.id_produit}
              >
                <Controller
                  control={control}
                  name="id_produit"
                  render={({ field }) => (
                    <Combobox
                      valeur={field.value}
                      onChange={field.onChange}
                      options={optionsMP}
                      placeholder="Choisir une matière première"
                      recherchePlaceholder="Rechercher une matière…"
                      disabled={verrouille}
                      invalide={Boolean(errors.id_produit)}
                    />
                  )}
                />
              </Champ>
            </div>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
              <Champ
                libelle="Date du devis"
                obligatoire
                erreur={errors.date_devis?.message}
                modifie={dirtyFields.date_devis}
              >
                <Input type="date" max={dateISO()} {...register('date_devis')} />
              </Champ>
              <Champ
                libelle="Prix unitaire (DT)"
                obligatoire
                erreur={errors.prix_unitaire?.message}
                modifie={dirtyFields.prix_unitaire}
              >
                <Input inputMode="decimal" placeholder="0,000" {...register('prix_unitaire')} />
              </Champ>
              <Champ
                libelle="Délai de livraison (jours)"
                obligatoire
                erreur={errors.delai_livraison?.message}
                modifie={dirtyFields.delai_livraison}
              >
                <Input inputMode="numeric" placeholder="0" {...register('delai_livraison')} />
              </Champ>
            </div>
          </fieldset>
          <Encart ton="neutral" icone={Calculator}>
            {montantQ !== null ? (
              <>
                Montant estimé pour Q* ({formatNombre(matiere.quantite_economique)} {matiere.unite})
                = <strong className="text-ink tabular">{formatMontant(montantQ)}</strong>
              </>
            ) : matiere && !matiere.quantite_economique ? (
              'Montant estimé indisponible : les paramètres de calcul de cette matière sont incomplets (Q* non calculée).'
            ) : (
              'Choisissez une matière et saisissez le prix : le montant estimé pour la quantité économique Q* s’affichera ici.'
            )}
          </Encart>
          {verrouille ? (
            <div className="border-line flex justify-end border-t pt-5">
              <Button type="button" variant="outline" onClick={() => naviguer('/gerant/devis')}>
                Retour aux devis
              </Button>
            </div>
          ) : (
            <PiedFormulaire
              modification={modification}
              nbModifies={compterModifies(dirtyFields)}
              enCours={isSubmitting}
              onAnnuler={() => naviguer('/gerant/devis')}
              libelle={modification ? undefined : 'Enregistrer le devis'}
            />
          )}
        </Carte>

        {modification && (
          <div className="flex flex-col gap-[18px]">
            <FicheResume
              lien={`/gerant/fournisseurs/${devis.id_fournisseur}`}
              lignes={[
                ['Référence', reference('DEV', devis.id_devis)],
                ['Fournisseur', devis.fournisseur?.raison_sociale],
                ['Date', formatDate(devis.date_devis)],
                ['Commandes liées', formatNombre(devis.commande_fournisseur?.length ?? 0)],
              ]}
            />
            {!verrouille && (
              <ZoneDanger
                titre="Supprimer le devis"
                action={
                  <Button variant="danger" onClick={() => setConfirmer(true)}>
                    <Trash2 /> Supprimer
                  </Button>
                }
              >
                Ce devis n'est utilisé dans aucune commande : il peut être supprimé définitivement.
              </ZoneDanger>
            )}
          </div>
        )}
      </div>
      {modification && (
        <ConfirmDialog
          ouvert={confirmer}
          onOuvertChange={setConfirmer}
          titre={`Supprimer le devis ${reference('DEV', devis.id_devis)} ?`}
          message="Cette suppression est définitive."
          libelleConfirmer="Supprimer le devis"
          onConfirmer={() => suppression.mutateAsync()}
        />
      )}
    </Page>
  )
}

export default function DevisFormulaire() {
  const { id } = useParams()
  const requete = useQuery({
    queryKey: ['devis', Number(id)],
    queryFn: () => lireDevis(Number(id)),
    enabled: Boolean(id),
  })
  if (!id) return <Formulaire />
  if (requete.isPending) return <SqueletteFormulaire champs={5} />
  if (requete.isError)
    return (
      <Carte>
        <EtatErreur erreur={requete.error} onReessayer={requete.refetch} />
      </Carte>
    )
  return <Formulaire key={requete.data.id_devis} devis={requete.data} />
}
