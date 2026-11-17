/*
 * C3bis — Ajouter / modifier un produit (/chef/produits/nouveau, /:id/modifier).
 * Ajout : type (MP / Article), code unique, désignation, unité, stock initial ;
 *   article : prix de vente > 0 et seuil minimum entier → rpc('creer_produit')
 *   (crée aussi le mouvement « Stock initial »).
 * Modification : type et stock verrouillés ; update produit (désignation, unité, prix, seuil).
 */
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Armchair, Info, Layers, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { creerProduit, lireProduit, modifierProduit } from '@/api/stock'
import { useSuppression } from '@/hooks/useSuppression'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { nombre } from '@/lib/schemas'
import { formatNombre } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Encart } from '@/components/commun/Encart'
import { Onglets } from '@/components/commun/Onglets'
import { EtatErreur, SqueletteFormulaire } from '@/components/commun/Etats'
import { FicheResume, PiedFormulaire, ZoneDanger, compterModifies } from '@/components/commun/Formulaire'
import { ConfirmDialog } from '@/components/commun/Dialogues'

const entierPositif = (message) => nombre(message).refine((v) => Number.isInteger(v) && v >= 0, 'Saisissez un nombre entier, 0 ou plus.')

const schema = z
  .object({
    type: z.enum(['MP', 'ARTICLE']),
    code: z
      .string()
      .trim()
      .min(1, 'Le code est obligatoire.')
      .max(20)
      .regex(/^[A-Za-z0-9-]+$/, 'Lettres, chiffres et tirets uniquement.')
      .transform((v) => v.toUpperCase()),
    designation: z.string().trim().min(1, 'La désignation est obligatoire.').max(120),
    unite: z.string().trim().min(1, "L'unité est obligatoire.").max(30),
    stockInitial: entierPositif('Saisissez le stock initial.'),
    prixVente: z.string(),
    seuilMinimum: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.type !== 'ARTICLE') return
    const prix = Number(String(v.prixVente).replace(',', '.'))
    if (!v.prixVente || Number.isNaN(prix) || prix <= 0) ctx.addIssue({ code: 'custom', path: ['prixVente'], message: 'Le prix de vente doit être supérieur à 0.' })
    const seuil = Number(v.seuilMinimum)
    if (v.seuilMinimum === '' || !Number.isInteger(seuil) || seuil < 0) ctx.addIssue({ code: 'custom', path: ['seuilMinimum'], message: 'Le seuil minimum est un nombre entier, 0 ou plus.' })
  })

function Formulaire({ produit }) {
  const naviguer = useNavigate()
  const [parametres] = useSearchParams()
  const modification = Boolean(produit)
  const [confirmer, setConfirmer] = useState(false)
  const { suppression, reactivation } = useSuppression('produit', { onSupprime: () => naviguer('/chef/produits') })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: produit?.type ?? (parametres.get('type') === 'ARTICLE' ? 'ARTICLE' : 'MP'),
      code: produit?.code ?? '',
      designation: produit?.designation ?? '',
      unite: produit?.unite ?? '',
      stockInitial: produit ? String(produit.quantite_stock) : '0',
      prixVente: produit?.prix_vente !== null && produit?.prix_vente !== undefined ? String(produit.prix_vente) : '',
      seuilMinimum: produit?.seuil_minimum !== null && produit?.seuil_minimum !== undefined ? String(produit.seuil_minimum) : '',
    },
  })
  const type = useWatch({ control, name: 'type' })
  const article = type === 'ARTICLE'

  const soumettre = async (v) => {
    try {
      if (modification) {
        await modifierProduit(produit.id_produit, { ...v, type: produit.type, prixVente: String(v.prixVente).replace(',', '.') })
        await invalider('stock')
        toast.success('Produit modifié.')
        naviguer(`/chef/produits/${produit.id_produit}`)
      } else {
        const id = await creerProduit({ ...v, prixVente: String(v.prixVente).replace(',', '.') })
        await invalider('stock')
        toast.success(`Produit ${v.code.toUpperCase()} créé.`, { description: `Stock initial : ${formatNombre(v.stockInitial)} ${v.unite}` })
        naviguer(`/chef/produits/${id}`)
      }
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  return (
    <Page>
      <PageEntete
        titre={modification ? 'Modifier le produit' : 'Nouveau produit'}
        description={
          modification
            ? `${produit.code} · le type et le stock ne se modifient pas ici (le stock évolue uniquement par les mouvements).`
            : 'Une matière première achetée aux fournisseurs ou un article fabriqué et vendu par NBM.'
        }
        badges={modification && <Badge ton="dark">Modification</Badge>}
      />
      <div className={modification ? 'grid items-start gap-[18px] lg:grid-cols-[2fr_minmax(280px,1fr)]' : 'max-w-3xl'}>
        <Carte as="form" onSubmit={handleSubmit(soumettre)} noValidate>
          <CarteEntete titre="Produit" />
          <Champ libelle="Type de produit" verrouille={modification} infoVerrou="Fixé à la création">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Onglets
                  libelle="Type de produit"
                  valeur={field.value}
                  onChange={(v) => !modification && field.onChange(v)}
                  options={[
                    { valeur: 'MP', libelle: 'Matière première', icone: Layers, desactive: modification && field.value !== 'MP' },
                    { valeur: 'ARTICLE', libelle: 'Article', icone: Armchair, desactive: modification && field.value !== 'ARTICLE' },
                  ]}
                  className="self-start"
                />
              )}
            />
          </Champ>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-[180px_1fr]">
            <Champ libelle="Code" obligatoire erreur={errors.code?.message} aide={!modification && 'Unique, ex. MP016 ou ART012'} verrouille={modification} infoVerrou="Le code ne se modifie pas">
              <Input className="font-mono uppercase" readOnly={modification} autoFocus={!modification} {...register('code')} />
            </Champ>
            <Champ libelle="Désignation" obligatoire erreur={errors.designation?.message} modifie={dirtyFields.designation}>
              <Input {...register('designation')} />
            </Champ>
          </div>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Champ libelle="Unité" obligatoire erreur={errors.unite?.message} aide="Au singulier : panneau, planche, pièce, litre…" modifie={dirtyFields.unite}>
              <Input {...register('unite')} />
            </Champ>
            <Champ
              libelle={modification ? 'Stock actuel' : 'Stock initial'}
              obligatoire={!modification}
              erreur={errors.stockInitial?.message}
              verrouille={modification}
              infoVerrou="Le stock évolue uniquement par les mouvements et l'inventaire"
              aide={!modification && 'Crée le mouvement « Stock initial »'}
            >
              <Input inputMode="numeric" readOnly={modification} {...register('stockInitial')} />
            </Champ>
            {article && (
              <>
                <Champ libelle="Prix de vente (DT)" obligatoire erreur={errors.prixVente?.message} modifie={dirtyFields.prixVente}>
                  <Input inputMode="decimal" placeholder="0,000" {...register('prixVente')} />
                </Champ>
                <Champ libelle="Seuil minimum" obligatoire erreur={errors.seuilMinimum?.message} aide="Alerte « À produire » quand le stock l'atteint" modifie={dirtyFields.seuilMinimum}>
                  <Input inputMode="numeric" {...register('seuilMinimum')} />
                </Champ>
              </>
            )}
          </div>
          {!article && (
            <Encart ton="info" icone={Info}>
              Les paramètres de calcul des matières premières (coût de commande, coût de détention, délai, jours de sécurité) sont réglés par le gérant.
            </Encart>
          )}
          <PiedFormulaire
            modification={modification}
            nbModifies={compterModifies(dirtyFields)}
            enCours={isSubmitting}
            onAnnuler={() => naviguer(modification ? `/chef/produits/${produit.id_produit}` : '/chef/produits')}
            libelle={modification ? undefined : 'Créer le produit'}
          />
        </Carte>

        {modification && (
          <div className="flex flex-col gap-[18px]">
            <FicheResume
              lien={`/chef/produits/${produit.id_produit}`}
              lignes={[
                ['Code', produit.code],
                ['Type', produit.type === 'MP' ? 'Matière première' : 'Article'],
                ['Stock', `${formatNombre(produit.quantite_stock)} ${produit.unite}`],
                ['Statut', produit.actif ? 'Actif' : 'Inactif'],
              ]}
            />
            {produit.actif ? (
              <ZoneDanger
                titre="Supprimer le produit"
                action={
                  <Button variant="danger" onClick={() => setConfirmer(true)}>
                    <Trash2 /> Supprimer ou désactiver
                  </Button>
                }
              >
                S'il a des mouvements, des devis ou des ventes, le produit est seulement désactivé : il disparaît des listes de travail mais son historique est conservé.
              </ZoneDanger>
            ) : (
              <ZoneDanger
                titre="Produit désactivé"
                action={
                  <Button variant="outline" onClick={() => reactivation.mutate(produit.id_produit)} disabled={reactivation.isPending}>
                    <RotateCcw /> Réactiver
                  </Button>
                }
              >
                Il n'apparaît plus dans les listes de choix. Réactivez-le pour l'utiliser à nouveau.
              </ZoneDanger>
            )}
          </div>
        )}
      </div>
      {modification && (
        <ConfirmDialog
          ouvert={confirmer}
          onOuvertChange={setConfirmer}
          titre={`Supprimer « ${produit.designation} » ?`}
          message="S'il a des données liées, le produit sera seulement désactivé ; sinon il sera supprimé."
          libelleConfirmer="Confirmer"
          onConfirmer={() => suppression.mutateAsync(produit.id_produit)}
        />
      )}
    </Page>
  )
}

export default function ProduitFormulaire() {
  const { id } = useParams()
  const requete = useQuery({ queryKey: ['produit', Number(id)], queryFn: () => lireProduit(Number(id)), enabled: Boolean(id) })
  if (!id) return <Formulaire />
  if (requete.isPending) return <SqueletteFormulaire champs={6} />
  if (requete.isError) return <Carte><EtatErreur erreur={requete.error} onReessayer={requete.refetch} /></Carte>
  return <Formulaire key={requete.data.id_produit} produit={requete.data} />
}
