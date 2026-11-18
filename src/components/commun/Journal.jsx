/*
 * Journal d'activité filtrable (A4 Mon activité, B12bis onglet Activité, B13 Activité des chefs) :
 * onglets par domaine avec compteurs, recherche, tableau paginé (date, heure, domaine, opération, détail).
 * Le journal est alimenté automatiquement par le serveur et n'est jamais modifiable.
 */
import { useMemo, useState } from 'react'
import { History } from 'lucide-react'
import { correspond, formatDate, formatHeure } from '@/lib/format'
import { LIBELLES_DOMAINES, domaineLigne, libelleOperation } from '@/api/journal'
import { Badge } from '@/components/commun/Badge'
import { DataTable } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { Recherche } from '@/components/commun/Recherche'

export function JournalActivite({
  lignes,
  profil,
  domaines,
  afficherUtilisateur = false,
  chargement,
  erreur,
  onReessayer,
}) {
  const [domaine, setDomaine] = useState('tout')
  const [recherche, setRecherche] = useState('')

  const enrichies = useMemo(
    () =>
      (lignes ?? []).map((l) => ({
        ...l,
        domaine: domaineLigne(l, profil),
        operation: libelleOperation(l),
        auteur: l.utilisateur ? `${l.utilisateur.prenom} ${l.utilisateur.nom}` : '',
      })),
    [lignes, profil],
  )

  const compteurs = useMemo(() => {
    const c = {}
    for (const l of enrichies) c[l.domaine] = (c[l.domaine] ?? 0) + 1
    return c
  }, [enrichies])

  const filtrees = useMemo(
    () =>
      enrichies.filter(
        (l) =>
          (domaine === 'tout' || l.domaine === domaine) &&
          correspond(
            recherche,
            l.operation,
            l.detail,
            l.auteur,
            LIBELLES_DOMAINES[l.domaine]?.libelle,
          ),
      ),
    [enrichies, domaine, recherche],
  )

  const colonnes = [
    {
      id: 'date',
      entete: 'Date',
      cellule: (l) => <span className="tabular">{formatDate(l.date_heure)}</span>,
      largeur: 120,
    },
    {
      id: 'heure',
      entete: 'Heure',
      cellule: (l) => <span className="text-mutedtxt tabular">{formatHeure(l.date_heure)}</span>,
      largeur: 80,
    },
    ...(afficherUtilisateur
      ? [
          {
            id: 'auteur',
            entete: 'Chef magasin',
            cellule: (l) => <span className="font-medium">{l.auteur || '—'}</span>,
            tri: (l) => l.auteur,
          },
        ]
      : []),
    {
      id: 'domaine',
      entete: 'Domaine',
      cellule: (l) => (
        <Badge ton={LIBELLES_DOMAINES[l.domaine]?.ton}>
          {LIBELLES_DOMAINES[l.domaine]?.libelle}
        </Badge>
      ),
      largeur: 120,
    },
    {
      id: 'operation',
      entete: 'Opération',
      cellule: (l) => <span className="text-ink font-semibold">{l.operation}</span>,
    },
    {
      id: 'detail',
      entete: 'Détail',
      cellule: (l) => <span className="text-ink3">{l.detail || '—'}</span>,
      classe: 'min-w-[240px]',
    },
  ]

  const options = [
    { valeur: 'tout', libelle: 'Tout' },
    ...domaines.map((d) => ({
      valeur: d,
      libelle: LIBELLES_DOMAINES[d].libelle,
      compteur: compteurs[d] ?? 0,
    })),
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
        <Onglets options={options} valeur={domaine} onChange={setDomaine} libelle="Domaine" />
        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Rechercher dans le journal"
          className="sm:w-[320px]"
        />
      </div>
      <DataTable
        colonnes={colonnes}
        lignes={filtrees}
        cle={(l) => l.id_journal}
        chargement={chargement}
        erreur={erreur}
        onReessayer={onReessayer}
        libelleElements="opération(s) correspondant aux critères"
        vide={
          <EtatVide
            icone={History}
            titre="Aucune opération"
            message={
              recherche || domaine !== 'tout'
                ? 'Aucune opération ne correspond aux critères.'
                : 'Aucune opération enregistrée sur cette période.'
            }
          />
        }
      />
    </div>
  )
}
