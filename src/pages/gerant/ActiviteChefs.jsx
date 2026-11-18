/*
 * B13 — Activité des chefs magasin (/gerant/activite-chefs).
 * Journal de tous les chefs magasin (journal_activite) : filtre par chef (combobox),
 * onglets par domaine, période ; compteurs par chef.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { lireJournalPeriode } from '@/api/journal'
import { useChefs } from '@/hooks/useDonnees'
import { formatDateHeure, formatNombre } from '@/lib/format'
import { debutPeriode, PERIODES } from '@/lib/periodes'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { Avatar } from '@/components/commun/Avatar'
import { Combobox } from '@/components/commun/Combobox'
import { Onglets } from '@/components/commun/Onglets'
import { JournalActivite } from '@/components/commun/Journal'
import { Skeleton } from '@/components/ui/skeleton'
import { elementCascade, listeCascade } from '@/components/commun/animations'

export default function ActiviteChefs() {
  const chefs = useChefs()
  const [idChef, setIdChef] = useState(null)
  const [periode, setPeriode] = useState(30)
  const ids = useMemo(() => (chefs.data ?? []).map((c) => c.id_utilisateur), [chefs.data])

  const journal = useQuery({
    queryKey: ['journal', 'chefs', ids, periode],
    queryFn: () => lireJournalPeriode({ idsUtilisateurs: ids, depuis: debutPeriode(periode) }),
    enabled: chefs.isSuccess,
  })

  const parChef = useMemo(() => {
    const c = {}
    for (const l of journal.data ?? []) {
      const s = (c[l.id_utilisateur] ??= { total: 0, mouvements: 0, factures: 0, derniere: null })
      s.total += 1
      if (['MOUVEMENT', 'INVENTAIRE'].includes(l.action)) s.mouvements += 1
      if (['FACTURE_CLIENT', 'FACTURE_FOURNISSEUR'].includes(l.action)) s.factures += 1
      if (!s.derniere || l.date_heure > s.derniere) s.derniere = l.date_heure
    }
    return c
  }, [journal.data])

  const lignes = (journal.data ?? []).filter((l) => !idChef || l.id_utilisateur === idChef)

  return (
    <Page>
      <PageEntete
        titre="Activité des chefs magasin"
        description="Consultation du journal des chefs magasin : opérations enregistrées automatiquement par le serveur, non modifiables."
        actions={
          <Onglets
            options={PERIODES}
            valeur={periode}
            onChange={setPeriode}
            libelle="Période"
            taille="sm"
          />
        }
      />

      {chefs.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-[110px] rounded-[14px]" />
          <Skeleton className="h-[110px] rounded-[14px]" />
        </div>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" {...listeCascade}>
          {(chefs.data ?? []).map((c) => {
            const s = parChef[c.id_utilisateur] ?? { total: 0, mouvements: 0, factures: 0 }
            const actif = idChef === c.id_utilisateur
            return (
              <motion.button
                key={c.id_utilisateur}
                type="button"
                variants={elementCascade.variants}
                onClick={() => setIdChef(actif ? null : c.id_utilisateur)}
                aria-pressed={actif}
                className={`bg-surf shadow-card hover:shadow-hover flex cursor-pointer items-start gap-3 rounded-[14px] border p-4 text-left transition-[border-color,box-shadow] ${actif ? 'border-ink ring-ink ring-1' : 'border-line hover:border-line2'}`}
              >
                <Avatar utilisateur={c} taille={40} />
                <span className="min-w-0 flex-1">
                  <span className="text-ink block truncate text-[15px] font-semibold">
                    {c.prenom} {c.nom}{' '}
                    {!c.actif && (
                      <span className="text-mutedtxt text-[12px] font-normal">(désactivé)</span>
                    )}
                  </span>
                  <span className="text-mutedtxt tabular block text-[13px]">
                    {formatNombre(s.total)} opération(s) · {formatNombre(s.mouvements)} mouvement(s)
                    · {formatNombre(s.factures)} facture(s)
                  </span>
                  <span className="text-muted2 mt-1 block text-[12px]">
                    Dernière opération : {s.derniere ? formatDateHeure(s.derniere) : '—'}
                  </span>
                </span>
              </motion.button>
            )
          })}
          {chefs.data?.length === 0 && (
            <p className="text-mutedtxt text-[14px]">
              Aucun chef magasin.{' '}
              <Link to="/gerant/utilisateurs/nouveau" className="underline">
                Créer un compte
              </Link>
            </p>
          )}
        </motion.div>
      )}

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="px-[22px] pt-[22px]">
          <Combobox
            libelle="Filtrer par chef magasin"
            valeur={idChef}
            onChange={setIdChef}
            options={(chefs.data ?? []).map((c) => ({
              valeur: c.id_utilisateur,
              libelle: `${c.prenom} ${c.nom}`,
              sousLibelle: c.email,
            }))}
            placeholder="Tous les chefs magasin"
            recherchePlaceholder="Nom ou e-mail…"
            effacable
            className="sm:w-[360px]"
          />
        </div>
        <JournalActivite
          key={idChef ?? 'tous'}
          lignes={lignes}
          profil="CHEF_MAGASIN"
          domaines={['stock', 'ventes', 'achats', 'connexion']}
          afficherUtilisateur
          chargement={chefs.isPending || journal.isPending}
          erreur={journal.error ?? chefs.error}
          onReessayer={journal.refetch}
        />
      </Carte>
    </Page>
  )
}
