/*
 * B1 — Tableau de bord du gérant (/gerant), rafraîchi toutes les minutes.
 * Indicateurs : matières en alerte, commandes en retard, ventes du mois précédent, valeur du stock MP.
 * « À traiter » (produits en alerte, v_etat_stock), ventes des 6 derniers mois (facture_client),
 * commandes en attente de livraison (en retard / prévue aujourd'hui / dans N jours).
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Armchair, Clock, Database, Layers, Loader2, Plus, Receipt, TriangleAlert, PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCommandes, useEtatStock, usePrixAchat, useRetards, periodique } from '@/hooks/useDonnees'
import { listerFacturesClient } from '@/api/ventes'
import { telechargerSauvegarde } from '@/api/journal'
import { dateISO, formatDate, formatMilliers, formatMois, formatMoisCourt, formatMontant, formatMontantArrondi, formatNombre, reference } from '@/lib/format'
import { etatCommande, etatStock } from '@/lib/etats'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleBlocs, GrilleIndicateurs } from '@/components/commun/Carte'
import { Pastille, StatCard } from '@/components/commun/StatCard'
import { Badge, BadgeEtat } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable, Reference } from '@/components/commun/DataTable'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { Histogramme } from '@/components/commun/Graphiques'
import { elementCascade, listeCascade } from '@/components/commun/animations'

function debutMois(decalage) {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() + decalage)
  return d
}

export default function TableauDeBordGerant() {
  const { utilisateur } = useAuth()
  const naviguer = useNavigate()
  const [reperes] = useState(() => ({ debut6: debutMois(-5), debutPrecedent: debutMois(-1), debutCourant: debutMois(0) }))
  const stock = useEtatStock(periodique)
  const prix = usePrixAchat()
  const retards = useRetards(periodique)
  const commandes = useCommandes(periodique)
  const factures = useQuery({
    queryKey: ['tableau-de-bord', 'factures', dateISO(reperes.debut6)],
    queryFn: () => listerFacturesClient({ depuis: dateISO(reperes.debut6) }),
    ...periodique,
  })

  const sauvegarde = useMutation({
    mutationFn: telechargerSauvegarde,
    onSuccess: async (r) => {
      await invalider('journal')
      toast.success('Sauvegarde téléchargée.', { description: r.nom })
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const mp = (stock.data ?? []).filter((p) => p.type === 'MP' && p.actif)
  const enAlerte = (stock.data ?? []).filter((p) => p.actif && p.en_alerte).sort((a, b) => (a.type === b.type ? a.quantite_stock - b.quantite_stock : a.type === 'MP' ? -1 : 1))
  const mpAlerte = enAlerte.filter((p) => p.type === 'MP')
  const enAttente = (commandes.data ?? []).filter((c) => c.etat === 'EN_ATTENTE').sort((a, b) => a.jours_restants - b.jours_restants)
  const valeurMP = mp.reduce((t, p) => t + p.quantite_stock * (prix.data?.[p.id_produit] ?? 0), 0)

  const ventes = useMemo(() => {
    const mois = []
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(reperes.debut6)
      d.setMonth(reperes.debut6.getMonth() + i)
      mois.push({ cle: dateISO(d).slice(0, 7), mois: formatMoisCourt(d), montant: 0, nombre: 0 })
    }
    const parCle = Object.fromEntries(mois.map((m) => [m.cle, m]))
    for (const f of factures.data ?? []) {
      const m = parCle[f.date_facture.slice(0, 7)]
      if (m) {
        m.montant += Number(f.montant_total)
        m.nombre += 1
      }
    }
    return mois
  }, [factures.data, reperes])
  const precedent = ventes.at(-2)

  const colonnes = [
    { id: 'ref', entete: 'Commande', cellule: (c) => <Reference className="underline underline-offset-2">{reference('CMD', c.id_commande)}</Reference> },
    { id: 'mp', entete: 'Matière · fournisseur', cellule: (c) => <CellulePrincipale titre={c.devis?.produit?.designation} sousTitre={c.devis?.fournisseur?.raison_sociale} /> },
    { id: 'qte', entete: 'Quantité', align: 'right', cellule: (c) => formatNombre(c.quantite) },
    { id: 'prevue', entete: 'Livraison prévue', cellule: (c) => formatDate(c.date_prevue) },
    { id: 'etat', entete: 'État', cellule: (c) => <BadgeEtat etat={etatCommande(c)} /> },
  ]

  return (
    <Page>
      <PageEntete
        titre={`Bonjour ${utilisateur?.prenom ?? ''}`}
        description="Voici l'essentiel du jour : les alertes de stock, les commandes à suivre et l'activité commerciale."
        actions={
          <>
            <Button variant="outline" onClick={() => sauvegarde.mutate()} disabled={sauvegarde.isPending}>
              {sauvegarde.isPending ? <Loader2 className="animate-spin" /> : <Database />} Sauvegarder
            </Button>
            <Button asChild>
              <Link to="/gerant/commander">
                <Plus /> Nouvelle commande
              </Link>
            </Button>
          </>
        }
      />

      <GrilleIndicateurs>
        <StatCard
          libelle="Matières en alerte"
          valeur={mpAlerte.length}
          sousTexte={`${mpAlerte.filter((p) => p.etat === 'A_COMMANDER').length} à commander, ${mpAlerte.filter((p) => p.etat === 'COMMANDE_EN_COURS').length} commande en cours`}
          icone={TriangleAlert}
          ton="danger"
          to="/gerant/stock/matieres"
          chargement={stock.isPending}
        />
        <StatCard
          libelle="Commandes en retard"
          valeur={retards.data?.length ?? 0}
          sousTexte={`${formatNombre(enAttente.length)} commande(s) en attente de livraison`}
          icone={Clock}
          ton="warn"
          to="/gerant/commandes?etat=EN_ATTENTE"
          chargement={retards.isPending || commandes.isPending}
        />
        <StatCard
          libelle={`Ventes ${/^[aeiou]/i.test(formatMois(reperes.debutPrecedent)) ? "d'" : 'de '}${formatMois(reperes.debutPrecedent)}`}
          valeur={precedent?.montant ?? 0}
          formater={formatMontantArrondi}
          sousTexte={`${formatNombre(precedent?.nombre ?? 0)} facture(s) client`}
          icone={Receipt}
          ton="ok"
          to="/gerant/statistiques"
          chargement={factures.isPending}
        />
        <StatCard
          libelle="Valeur du stock MP"
          valeur={valeurMP}
          formater={formatMontantArrondi}
          sousTexte={`${formatNombre(mp.length)} matières premières suivies`}
          icone={Layers}
          to="/gerant/stock/matieres"
          chargement={stock.isPending || prix.isPending}
        />
      </GrilleIndicateurs>

      <GrilleBlocs>
        <Carte>
          <CarteEntete
            titre="À traiter"
            description="Produits ayant atteint leur point de commande ou leur seuil"
            action={
              <Link to="/gerant/stock/matieres" className="text-[14px] font-medium underline underline-offset-4 hover:opacity-75">
                Tout le stock
              </Link>
            }
          />
          {stock.isPending ? (
            <SqueletteBloc hauteur={200} className="border-0 p-0" />
          ) : stock.isError ? (
            <EtatErreur erreur={stock.error} onReessayer={stock.refetch} />
          ) : enAlerte.length === 0 ? (
            <EtatVide icone={PackageCheck} titre="Rien à traiter" message="Tous les produits sont au-dessus de leur point de commande ou de leur seuil." compact />
          ) : (
            <motion.ul className="flex flex-col" {...listeCascade}>
              {enAlerte.slice(0, 6).map((p) => {
                const etat = etatStock(p.etat)
                const commande = enAttente.find((c) => c.devis?.produit?.id_produit === p.id_produit)
                return (
                  <motion.li key={p.id_produit} variants={elementCascade.variants} className="flex items-center gap-4 border-b border-line3 py-3.5 last:border-0">
                    <Pastille icone={p.type === 'MP' ? Layers : Armchair} ton={etat.ton} taille={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">{p.designation}</p>
                      <p className="text-[13px] text-mutedtxt">
                        Stock {formatNombre(p.quantite_stock)} · {p.type === 'MP' ? 'point de commande' : 'seuil minimum'} {formatNombre(p.seuil)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge ton={etat.ton}>{etat.libelle}</Badge>
                      {p.etat === 'A_COMMANDER' && (
                        <Button size="sm" asChild>
                          <Link to={`/gerant/commander?produit=${p.id_produit}`}>Commander</Link>
                        </Button>
                      )}
                      {p.etat === 'COMMANDE_EN_COURS' && commande && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/gerant/commandes/${commande.id_commande}`}>Voir la commande</Link>
                        </Button>
                      )}
                    </div>
                  </motion.li>
                )
              })}
              {enAlerte.length > 6 && <li className="pt-3 text-[13px] text-mutedtxt">+ {enAlerte.length - 6} autre(s) produit(s) en alerte</li>}
            </motion.ul>
          )}
        </Carte>

        <Carte>
          <CarteEntete
            titre="Ventes des 6 derniers mois"
            description={`Montant facturé par mois, en milliers de dinars (k = 1 000 DT) · ${formatMois(reperes.debutCourant)} en cours`}
            action={
              <Link to="/gerant/statistiques" className="text-[14px] font-medium underline underline-offset-4 hover:opacity-75">
                Statistiques
              </Link>
            }
          />
          {factures.isPending ? (
            <SqueletteBloc hauteur={260} className="border-0 p-0" />
          ) : factures.isError ? (
            <EtatErreur erreur={factures.error} onReessayer={factures.refetch} />
          ) : (
            <Histogramme donnees={ventes} cleX="mois" cleY="montant" formaterAxe={formatMilliers} formaterValeur={formatMontant} libelleSerie="Ventes" miseEnAvant={(d) => d === ventes.at(-1)} hauteur={300} />
          )}
        </Carte>
      </GrilleBlocs>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="p-[22px] pb-4">
          <CarteEntete
            titre="Commandes en attente de livraison"
            description="Une commande est en retard quand la date prévue (commande + délai du devis) est dépassée"
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/gerant/commandes">Toutes les commandes</Link>
              </Button>
            }
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={enAttente}
          cle={(c) => c.id_commande}
          chargement={commandes.isPending}
          erreur={commandes.error}
          onReessayer={commandes.refetch}
          onLigneClick={(c) => naviguer(`/gerant/commandes/${c.id_commande}`)}
          libelleElements="commande(s) en attente"
          taillePage={5}
          vide={<EtatVide icone={PackageCheck} titre="Aucune commande en attente" message="Toutes les commandes passées ont été livrées." compact />}
        />
      </Carte>
    </Page>
  )
}
