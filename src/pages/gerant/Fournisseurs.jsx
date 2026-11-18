/*
 * B4 — Fournisseurs (/gerant/fournisseurs).
 * Tableau : raison sociale, contact, nombre de devis et de commandes, retard moyen, statut, actions.
 * Recherche + onglets Actifs / Inactifs / Tous. Supprimer ou désactiver par rpc('supprimer_ou_desactiver').
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Pencil, Plus, RotateCcw, Trash2, Truck } from 'lucide-react'
import { correspond, formatNombre, formatTelephone, reference } from '@/lib/format'
import { statutActif } from '@/lib/etats'
import { useEvaluations, useFournisseurs } from '@/hooks/useDonnees'
import { useSuppression } from '@/hooks/useSuppression'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { BadgeEtat } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'
import { InitialesCarre } from '@/components/commun/Avatar'
import { ConfirmDialog, useConfirmation } from '@/components/commun/Dialogues'
import { ActionIcone } from '@/components/commun/ActionIcone'

export default function Fournisseurs() {
  const naviguer = useNavigate()
  const fournisseurs = useFournisseurs()
  const evaluations = useEvaluations()
  const [statut, setStatut] = useState('actifs')
  const [recherche, setRecherche] = useState('')
  const confirmation = useConfirmation()
  const { suppression, reactivation } = useSuppression('fournisseur')

  const retards = useMemo(
    () =>
      Object.fromEntries((evaluations.data ?? []).map((e) => [e.id_fournisseur, e.retard_moyen])),
    [evaluations.data],
  )
  const liste = fournisseurs.data ?? []
  const compteurs = {
    actifs: liste.filter((f) => f.actif).length,
    inactifs: liste.filter((f) => !f.actif).length,
    tous: liste.length,
  }
  const filtres = liste.filter(
    (f) =>
      (statut === 'tous' || (statut === 'actifs' ? f.actif : !f.actif)) &&
      correspond(
        recherche,
        reference('FRN', f.id_fournisseur),
        f.raison_sociale,
        f.adresse,
        f.email,
        f.telephone,
      ),
  )

  const colonnes = [
    {
      id: 'fournisseur',
      entete: 'Fournisseur',
      tri: (f) => f.raison_sociale,
      cellule: (f) => (
        <CellulePrincipale
          avant={<InitialesCarre texte={f.raison_sociale} />}
          titre={f.raison_sociale}
          sousTitre={
            <>
              <span className="font-mono">{reference('FRN', f.id_fournisseur)}</span>
              {f.adresse && ` · ${f.adresse}`}
            </>
          }
        />
      ),
    },
    {
      id: 'contact',
      entete: 'Contact',
      cellule: (f) => (
        <div className="min-w-0">
          <div className="text-ink tabular">{formatTelephone(f.telephone)}</div>
          <div className="text-mutedtxt truncate text-[12px]">{f.email || '—'}</div>
        </div>
      ),
    },
    {
      id: 'devis',
      entete: 'Devis',
      align: 'right',
      tri: (f) => f.nb_devis,
      cellule: (f) => formatNombre(f.nb_devis),
    },
    {
      id: 'commandes',
      entete: 'Commandes',
      align: 'right',
      tri: (f) => f.nb_commandes,
      cellule: (f) => formatNombre(f.nb_commandes),
    },
    {
      id: 'retard',
      entete: 'Retard moyen',
      align: 'right',
      tri: (f) => retards[f.id_fournisseur],
      cellule: (f) => {
        const r = retards[f.id_fournisseur]
        return r === null || r === undefined ? (
          <span className="text-muted2">—</span>
        ) : (
          <span className={r > 0 ? 'text-dfg' : ''}>{formatNombre(r, 0, 1)} j</span>
        )
      },
    },
    { id: 'statut', entete: 'Statut', cellule: (f) => <BadgeEtat etat={statutActif(f.actif)} /> },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (f) => (
        <div className="flex justify-end gap-1">
          <ActionIcone
            libelle="Modifier"
            icone={Pencil}
            to={`/gerant/fournisseurs/${f.id_fournisseur}/modifier`}
          />
          {f.actif ? (
            <ActionIcone
              libelle="Supprimer ou désactiver"
              icone={Trash2}
              ton="danger"
              onClick={() => confirmation.ouvrir(f)}
            />
          ) : (
            <ActionIcone
              libelle="Réactiver"
              icone={RotateCcw}
              onClick={() => reactivation.mutate(f.id_fournisseur)}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Fournisseurs"
        description="Les fournisseurs de matières premières auxquels NBM demande des devis."
        actions={
          <Button asChild>
            <Link to="/gerant/fournisseurs/nouveau">
              <Plus /> Nouveau fournisseur
            </Link>
          </Button>
        }
      />
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Recherche
            valeur={recherche}
            onChange={setRecherche}
            placeholder="FRN-…, nom, adresse, e-mail"
          />
          <Onglets
            valeur={statut}
            onChange={setStatut}
            libelle="Statut"
            options={[
              { valeur: 'actifs', libelle: 'Actifs', compteur: compteurs.actifs },
              { valeur: 'inactifs', libelle: 'Inactifs', compteur: compteurs.inactifs },
              { valeur: 'tous', libelle: 'Tous', compteur: compteurs.tous },
            ]}
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtres}
          cle={(f) => f.id_fournisseur}
          chargement={fournisseurs.isPending}
          erreur={fournisseurs.error}
          onReessayer={fournisseurs.refetch}
          onLigneClick={(f) => naviguer(`/gerant/fournisseurs/${f.id_fournisseur}`)}
          libelleElements="fournisseur(s) affiché(s)"
          classeLigne={(f) => (!f.actif ? 'opacity-70' : '')}
          vide={
            <EtatVide
              icone={Truck}
              titre={
                liste.length ? 'Aucun fournisseur ne correspond' : 'Aucun fournisseur enregistré'
              }
              message={
                liste.length
                  ? 'Modifiez la recherche ou le filtre.'
                  : 'Ajoutez un premier fournisseur pour saisir ses devis.'
              }
              action={
                !liste.length && (
                  <Button asChild>
                    <Link to="/gerant/fournisseurs/nouveau">
                      <Plus /> Nouveau fournisseur
                    </Link>
                  </Button>
                )
              }
            />
          }
        />
      </Carte>

      <ConfirmDialog
        {...confirmation.proprietes}
        titre={`Supprimer « ${confirmation.cible?.raison_sociale ?? ''} » ?`}
        message="S'il a des devis ou des commandes, le fournisseur sera seulement désactivé : son historique est conservé."
        libelleConfirmer="Supprimer ou désactiver"
        onConfirmer={() => suppression.mutateAsync(confirmation.cible.id_fournisseur)}
      />
    </Page>
  )
}
