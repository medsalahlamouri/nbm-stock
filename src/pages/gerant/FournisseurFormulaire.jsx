/*
 * B5bis — Ajouter / modifier un fournisseur (/gerant/fournisseurs/nouveau, /:id/modifier).
 * Raison sociale obligatoire, téléphone à 8 chiffres, e-mail vérifié.
 * insert / update fournisseur (écriture directe autorisée au gérant), retour à la fiche avec un toast.
 * En modification : champs modifiés signalés en doré, fiche résumée et zone de désactivation.
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { creerFournisseur, lireFournisseur, modifierFournisseur } from '@/api/achats'
import { useFournisseurs } from '@/hooks/useDonnees'
import { useSuppression } from '@/hooks/useSuppression'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { emailFacultatif, telephone } from '@/lib/schemas'
import { formatNombre, formatTelephone, reference } from '@/lib/format'
import { statutActif } from '@/lib/etats'
import { useFilAriane } from '@/components/layout/FilAriane'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete } from '@/components/commun/Carte'
import { Badge, BadgeEtat } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { EtatErreur, SqueletteFormulaire } from '@/components/commun/Etats'
import {
  FicheResume,
  PiedFormulaire,
  ZoneDanger,
  compterModifies,
} from '@/components/commun/Formulaire'
import { ConfirmDialog } from '@/components/commun/Dialogues'

const schema = z.object({
  raison_sociale: z.string().trim().min(1, 'La raison sociale est obligatoire.').max(120),
  telephone,
  email: emailFacultatif,
  adresse: z.string().trim().max(200),
})

function Formulaire({ fournisseur }) {
  const naviguer = useNavigate()
  const modification = Boolean(fournisseur)
  const [confirmer, setConfirmer] = useState(false)
  const liste = useFournisseurs()
  const resume = liste.data?.find((f) => f.id_fournisseur === fournisseur?.id_fournisseur)
  const { suppression, reactivation } = useSuppression('fournisseur', {
    onSupprime: () => naviguer('/gerant/fournisseurs'),
  })
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      raison_sociale: fournisseur?.raison_sociale ?? '',
      telephone: fournisseur?.telephone ? formatTelephone(fournisseur.telephone) : '',
      email: fournisseur?.email ?? '',
      adresse: fournisseur?.adresse ?? '',
    },
  })
  const nbModifies = compterModifies(dirtyFields)

  const soumettre = async (valeurs) => {
    try {
      const resultat = modification
        ? await modifierFournisseur(fournisseur.id_fournisseur, valeurs)
        : await creerFournisseur(valeurs)
      await invalider('achats')
      toast.success(modification ? 'Fournisseur modifié.' : 'Fournisseur ajouté.')
      naviguer(`/gerant/fournisseurs/${resultat.id_fournisseur}`)
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  const retour = () =>
    naviguer(
      modification ? `/gerant/fournisseurs/${fournisseur.id_fournisseur}` : '/gerant/fournisseurs',
    )

  return (
    <Page>
      <PageEntete
        titre={modification ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        description={
          modification ? (
            <>
              <span className="font-mono">{reference('FRN', fournisseur.id_fournisseur)}</span> ·
              les champs modifiés sont signalés en doré.
            </>
          ) : (
            'Un fournisseur de matières premières auquel NBM pourra demander des devis.'
          )
        }
        badges={
          modification && (
            <>
              <Badge ton="dark">Modification</Badge>
              <BadgeEtat etat={statutActif(fournisseur.actif)} />
            </>
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
          <CarteEntete
            titre="Coordonnées"
            description="Seule la raison sociale est obligatoire. L'e-mail et le téléphone sont vérifiés."
          />
          <Champ
            libelle="Raison sociale"
            obligatoire
            erreur={errors.raison_sociale?.message}
            modifie={dirtyFields.raison_sociale}
          >
            <Input autoFocus={!modification} {...register('raison_sociale')} />
          </Champ>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Champ
              libelle="Téléphone"
              aide="8 chiffres"
              erreur={errors.telephone?.message}
              modifie={dirtyFields.telephone}
            >
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="72 000 000"
                {...register('telephone')}
              />
            </Champ>
            <Champ libelle="E-mail" erreur={errors.email?.message} modifie={dirtyFields.email}>
              <Input type="email" placeholder="contact@fournisseur.tn" {...register('email')} />
            </Champ>
          </div>
          <Champ libelle="Adresse" erreur={errors.adresse?.message} modifie={dirtyFields.adresse}>
            <Input {...register('adresse')} />
          </Champ>
          <PiedFormulaire
            modification={modification}
            nbModifies={nbModifies}
            enCours={isSubmitting}
            onAnnuler={retour}
            libelle={modification ? undefined : 'Ajouter le fournisseur'}
          />
        </Carte>

        {modification && (
          <div className="flex flex-col gap-[18px]">
            <FicheResume
              lien={`/gerant/fournisseurs/${fournisseur.id_fournisseur}`}
              lignes={[
                ['Identifiant', reference('FRN', fournisseur.id_fournisseur)],
                ['Devis enregistrés', formatNombre(resume?.nb_devis ?? 0)],
                ['Commandes', formatNombre(resume?.nb_commandes ?? 0)],
              ]}
            />
            {fournisseur.actif ? (
              <ZoneDanger
                titre="Désactiver le fournisseur"
                action={
                  <Button variant="danger" onClick={() => setConfirmer(true)}>
                    <Trash2 /> {resume?.nb_devis ? 'Désactiver' : 'Supprimer'}
                  </Button>
                }
              >
                {resume?.nb_devis
                  ? 'Ce fournisseur a des devis ou des commandes : il ne peut pas être supprimé, seulement désactivé.'
                  : "Ce fournisseur n'a aucune donnée liée : il sera supprimé définitivement."}
              </ZoneDanger>
            ) : (
              <ZoneDanger
                titre="Fournisseur désactivé"
                action={
                  <Button
                    variant="outline"
                    onClick={() => reactivation.mutate(fournisseur.id_fournisseur)}
                    disabled={reactivation.isPending}
                  >
                    <RotateCcw /> Réactiver
                  </Button>
                }
              >
                Il n'apparaît plus dans les listes de choix des devis. Réactivez-le pour lui
                demander de nouveaux devis.
              </ZoneDanger>
            )}
          </div>
        )}
      </div>
      {modification && (
        <ConfirmDialog
          ouvert={confirmer}
          onOuvertChange={setConfirmer}
          titre={`${resume?.nb_devis ? 'Désactiver' : 'Supprimer'} « ${fournisseur.raison_sociale} » ?`}
          message="S'il a des données liées, le fournisseur sera seulement désactivé ; sinon il sera supprimé."
          libelleConfirmer="Confirmer"
          onConfirmer={() => suppression.mutateAsync(fournisseur.id_fournisseur)}
        />
      )}
    </Page>
  )
}

export default function FournisseurFormulaire() {
  const { id } = useParams()
  const requete = useQuery({
    queryKey: ['fournisseur', Number(id)],
    queryFn: () => lireFournisseur(Number(id)),
    enabled: Boolean(id),
  })
  useFilAriane(id ? requete.data?.raison_sociale && 'Modifier' : null)
  if (!id) return <Formulaire />
  if (requete.isPending) return <SqueletteFormulaire champs={4} />
  if (requete.isError)
    return (
      <Carte>
        <EtatErreur erreur={requete.error} onReessayer={requete.refetch} />
      </Carte>
    )
  return <Formulaire key={requete.data.id_fournisseur} fournisseur={requete.data} />
}
