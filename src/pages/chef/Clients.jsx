/*
 * C8 — Clients (/chef/clients).
 * Tableau : nom, téléphone, adresse, nombre de demandes, total facturé, statut. Recherche + Actifs / Inactifs.
 * Ajout et modification en fenêtre (nom obligatoire, téléphone 8 chiffres, adresse) : insert / update client.
 * Supprimer ou désactiver : rpc('supprimer_ou_desactiver', 'client').
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FilePlus, Pencil, Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { creerClient, modifierClient } from '@/api/ventes'
import { useClients } from '@/hooks/useDonnees'
import { useSuppression } from '@/hooks/useSuppression'
import { correspond, formatMontant, formatNombre, formatTelephone, reference } from '@/lib/format'
import { statutActif } from '@/lib/etats'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { telephone } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { BadgeEtat } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'
import { InitialesCarre } from '@/components/commun/Avatar'
import { Champ } from '@/components/commun/Champ'
import { ActionIcone } from '@/components/commun/ActionIcone'
import { PiedFormulaire, compterModifies } from '@/components/commun/Formulaire'
import { ConfirmDialog, useConfirmation } from '@/components/commun/Dialogues'

const schema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire.').max(120),
  telephone,
  adresse: z.string().trim().max(200),
})

function FormulaireClient({ client, onFermer }) {
  const modification = Boolean(client)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nom: client?.nom ?? '', telephone: client?.telephone ? formatTelephone(client.telephone) : '', adresse: client?.adresse ?? '' },
  })
  const soumettre = async (valeurs) => {
    try {
      if (modification) await modifierClient(client.id_client, valeurs)
      else await creerClient(valeurs)
      await invalider('ventes')
      toast.success(modification ? 'Client modifié.' : 'Client ajouté.')
      onFermer()
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }
  return (
    <form onSubmit={handleSubmit(soumettre)} noValidate className="flex flex-col gap-4">
      <Champ libelle="Nom" obligatoire erreur={errors.nom?.message} modifie={modification && dirtyFields.nom}>
        <Input autoFocus placeholder="Nom et prénom ou raison sociale" {...register('nom')} />
      </Champ>
      <Champ libelle="Téléphone" aide="8 chiffres" erreur={errors.telephone?.message} modifie={modification && dirtyFields.telephone}>
        <Input type="tel" inputMode="numeric" placeholder="55 000 000" {...register('telephone')} />
      </Champ>
      <Champ libelle="Adresse" erreur={errors.adresse?.message} modifie={modification && dirtyFields.adresse}>
        <Input {...register('adresse')} />
      </Champ>
      <PiedFormulaire
        modification={modification}
        nbModifies={compterModifies(dirtyFields)}
        enCours={isSubmitting}
        onAnnuler={onFermer}
        libelle={modification ? undefined : 'Ajouter le client'}
      />
    </form>
  )
}

export default function Clients() {
  const clients = useClients()
  const [statut, setStatut] = useState('actifs')
  const [recherche, setRecherche] = useState('')
  const [fenetre, setFenetre] = useState(null) // null | { client? }
  const confirmation = useConfirmation()
  const { suppression, reactivation } = useSuppression('client')

  const liste = clients.data ?? []
  const filtres = liste.filter(
    (c) => (statut === 'tous' || (statut === 'actifs' ? c.actif : !c.actif)) && correspond(recherche, c.nom, c.telephone, c.adresse, reference('CLI', c.id_client)),
  )

  const colonnes = [
    {
      id: 'nom',
      entete: 'Client',
      tri: (c) => c.nom,
      cellule: (c) => <CellulePrincipale avant={<InitialesCarre texte={c.nom} />} titre={c.nom} sousTitre={<span className="font-mono">{reference('CLI', c.id_client)}</span>} />,
    },
    { id: 'tel', entete: 'Téléphone', cellule: (c) => <span className="tabular">{formatTelephone(c.telephone)}</span> },
    { id: 'adresse', entete: 'Adresse', tri: (c) => c.adresse, cellule: (c) => <span className="text-ink3">{c.adresse || '—'}</span> },
    { id: 'demandes', entete: 'Demandes', align: 'right', tri: (c) => c.nb_demandes, cellule: (c) => formatNombre(c.nb_demandes) },
    { id: 'total', entete: 'Total facturé', align: 'right', tri: (c) => c.total_facture, cellule: (c) => <strong>{formatMontant(c.total_facture)}</strong> },
    { id: 'statut', entete: 'Statut', cellule: (c) => <BadgeEtat etat={statutActif(c.actif)} /> },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (c) => (
        <div className="flex justify-end gap-1">
          {c.actif && <ActionIcone libelle="Nouvelle demande" icone={FilePlus} to={`/chef/demandes/nouvelle?client=${c.id_client}`} />}
          <ActionIcone libelle="Modifier" icone={Pencil} onClick={() => setFenetre({ client: c })} />
          {c.actif ? (
            <ActionIcone libelle="Supprimer ou désactiver" icone={Trash2} ton="danger" onClick={() => confirmation.ouvrir(c)} />
          ) : (
            <ActionIcone libelle="Réactiver" icone={RotateCcw} onClick={() => reactivation.mutate(c.id_client)} />
          )}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Clients"
        description="Les clients de NBM et leurs demandes. Un client qui a des demandes est désactivé plutôt que supprimé."
        actions={
          <Button onClick={() => setFenetre({})}>
            <Plus /> Nouveau client
          </Button>
        }
      />
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Recherche valeur={recherche} onChange={setRecherche} placeholder="Nom, téléphone, adresse" />
          <Onglets
            valeur={statut}
            onChange={setStatut}
            libelle="Statut"
            options={[
              { valeur: 'actifs', libelle: 'Actifs', compteur: liste.filter((c) => c.actif).length },
              { valeur: 'inactifs', libelle: 'Inactifs', compteur: liste.filter((c) => !c.actif).length },
              { valeur: 'tous', libelle: 'Tous', compteur: liste.length },
            ]}
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtres}
          cle={(c) => c.id_client}
          chargement={clients.isPending}
          erreur={clients.error}
          onReessayer={clients.refetch}
          onLigneClick={(c) => setFenetre({ client: c })}
          libelleElements="client(s)"
          classeLigne={(c) => (!c.actif ? 'opacity-70' : '')}
          vide={
            <EtatVide
              icone={Users}
              titre={liste.length ? 'Aucun client ne correspond' : 'Aucun client enregistré'}
              message={liste.length ? 'Modifiez la recherche ou le filtre.' : 'Ajoutez un client pour enregistrer ses demandes.'}
              action={
                !liste.length && (
                  <Button onClick={() => setFenetre({})}>
                    <Plus /> Nouveau client
                  </Button>
                )
              }
            />
          }
        />
      </Carte>

      <Dialog open={fenetre !== null} onOpenChange={(o) => !o && setFenetre(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{fenetre?.client ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
            <DialogDescription>
              {fenetre?.client ? (
                <>
                  <span className="font-mono">{reference('CLI', fenetre.client.id_client)}</span> · {formatNombre(fenetre.client.nb_demandes)} demande(s) ·{' '}
                  <Link to="/chef/demandes" className="underline underline-offset-2">
                    voir les demandes
                  </Link>
                </>
              ) : (
                'Seul le nom est obligatoire. Le téléphone est vérifié (8 chiffres).'
              )}
            </DialogDescription>
          </DialogHeader>
          {fenetre && <FormulaireClient key={fenetre.client?.id_client ?? 'nouveau'} client={fenetre.client} onFermer={() => setFenetre(null)} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        {...confirmation.proprietes}
        titre={`Supprimer « ${confirmation.cible?.nom ?? ''} » ?`}
        message="S'il a des demandes, le client sera seulement désactivé : son historique est conservé."
        libelleConfirmer="Supprimer ou désactiver"
        onConfirmer={() => suppression.mutateAsync(confirmation.cible.id_client)}
      />
    </Page>
  )
}
