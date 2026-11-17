/*
 * B10 — Quantité à commander (/gerant/calcul?produit=id).
 * rpc('simuler_calcul', { p_id_produit }) : détail pas à pas avec formules
 * (d = total / N, D = d × 365, Q* = ⌈√(2DS/H)⌉, SS = d × j, PC = ⌈d × L + SS⌉, coût annuel).
 * Simulation : second appel avec p_periode, résultats côte à côte, sans enregistrement.
 * Messages « Historique insuffisant » et « Paramètres de calcul incomplets » (lien vers B9).
 */
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Calculator, ClipboardList, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { simulerCalcul } from '@/api/stock'
import { useEtatStock } from '@/hooks/useDonnees'
import { formatMontant, formatNombre } from '@/lib/format'
import { etatStock } from '@/lib/etats'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleIndicateurs } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { Champ } from '@/components/commun/Champ'
import { Combobox } from '@/components/commun/Combobox'
import { Encart } from '@/components/commun/Encart'
import { Onglets } from '@/components/commun/Onglets'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'

const PERIODES = [30, 60, 90, 180].map((v) => ({ valeur: v, libelle: `${v} j` }))

const LIGNES = [
  { cle: 'd', libelle: 'Demande moyenne d', formule: 'sorties / N', format: (v) => `${formatNombre(v, 2)} / j` },
  { cle: 'D', libelle: 'Demande annuelle D', formule: 'd × 365', format: (v) => formatNombre(v, 2) },
  { cle: 'Q', libelle: 'Quantité économique Q*', formule: '⌈√(2·D·S / H)⌉', format: (v) => formatNombre(v), fort: true },
  { cle: 'SS', libelle: 'Stock de sécurité SS', formule: 'd × j', format: (v) => formatNombre(v, 2) },
  { cle: 'PC', libelle: 'Point de commande PC', formule: '⌈d × L + SS⌉', format: (v) => formatNombre(v), fort: true },
  { cle: 'N', libelle: 'Commandes par an', formule: 'D / Q*', format: (v) => formatNombre(v, 2), calcul: (r) => (r.Q ? r.D / r.Q : null) },
  { cle: 'cout_annuel', libelle: 'Coût annuel', formule: 'S·D/Q* + H·Q*/2', format: formatMontant },
]

const valeur = (ligne, r) => (ligne.calcul ? ligne.calcul(r) : r?.[ligne.cle])
const calculable = (r) => r && !r.message

export default function Calcul() {
  const [parametres, setParametres] = useSearchParams()
  const idProduit = parametres.get('produit') ? Number(parametres.get('produit')) : null
  const periodeSimulee = Number(parametres.get('periode')) || 60
  const stock = useEtatStock()
  const matieres = (stock.data ?? []).filter((p) => p.type === 'MP' && p.actif)
  const matiere = matieres.find((p) => p.id_produit === idProduit)

  const actuel = useQuery({ queryKey: ['simulation', idProduit], queryFn: () => simulerCalcul(idProduit), enabled: Boolean(idProduit) })
  const simulation = useQuery({ queryKey: ['simulation', idProduit, periodeSimulee], queryFn: () => simulerCalcul(idProduit, periodeSimulee), enabled: Boolean(idProduit) })
  const r = actuel.data
  const s = simulation.data

  const changer = (cle, v) =>
    setParametres(
      (p) => {
        if (v === null || v === undefined) p.delete(cle)
        else p.set(cle, String(v))
        return p
      },
      { replace: true },
    )

  return (
    <Page>
      <PageEntete
        titre="Quantité à commander"
        description="Détail du calcul de Wilson et du point de commande, avec simulation sur une autre période (rien n'est enregistré)."
        actions={
          <Button variant="outline" asChild>
            <Link to={`/gerant/parametres${idProduit ? `?produit=${idProduit}` : ''}`}>
              <SlidersHorizontal /> Paramètres
            </Link>
          </Button>
        }
      />
      <Carte>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Champ libelle="Matière première" className="w-full max-w-[520px]">
            <Combobox
              valeur={idProduit}
              onChange={(v) => changer('produit', v)}
              options={matieres.map((p) => ({ valeur: p.id_produit, libelle: p.designation, sousLibelle: p.code, droite: etatStock(p.etat).libelle }))}
              placeholder={stock.isPending ? 'Chargement…' : 'Rechercher une matière première'}
              recherchePlaceholder="Code ou désignation…"
              effacable
            />
          </Champ>
          <Champ libelle="Période simulée">
            <Onglets options={PERIODES} valeur={periodeSimulee} onChange={(v) => changer('periode', v)} libelle="Période simulée" />
          </Champ>
        </div>
      </Carte>

      {!idProduit ? (
        <Carte>
          <EtatVide icone={Calculator} titre="Choisissez une matière première" message="Le détail du calcul de Q* et du point de commande s'affichera ici." />
        </Carte>
      ) : actuel.isPending ? (
        <SqueletteBloc hauteur={300} />
      ) : actuel.isError ? (
        <Carte>
          <EtatErreur erreur={actuel.error} onReessayer={actuel.refetch} />
        </Carte>
      ) : !calculable(r) ? (
        <Carte>
          <Encart
            ton="warn"
            icone={TriangleAlert}
            titre={r?.message ?? 'Calcul impossible'}
            action={
              r?.message === 'Paramètres de calcul incomplets' && (
                <Button size="sm" asChild>
                  <Link to={`/gerant/parametres?produit=${idProduit}`}>Compléter les paramètres</Link>
                </Button>
              )
            }
          >
            {r?.message === 'Historique insuffisant'
              ? `Aucune consommation sur les ${r.periode} derniers jours (${formatNombre(r.total_consomme ?? 0)} sortie(s)) : la demande moyenne ne peut pas être estimée. Essayez une période plus longue.`
              : 'S, H, L et j doivent tous être renseignés pour calculer Q* et le point de commande.'}
          </Encart>
        </Carte>
      ) : (
        <>
          <GrilleIndicateurs>
            <StatCard libelle="Stock actuel" valeur={r.stock} sousTexte={`${matiere?.unite ?? ''} en stock`} />
            <StatCard libelle="Point de commande" valeur={r.PC} sousTexte={calculable(s) ? `simulation ${periodeSimulee} j : ${formatNombre(s.PC)}` : `simulation ${periodeSimulee} j : —`} />
            <StatCard libelle="Quantité économique Q*" valeur={r.Q} sousTexte={calculable(s) ? `simulation ${periodeSimulee} j : ${formatNombre(s.Q)}` : `simulation ${periodeSimulee} j : —`} />
            <StatCard libelle="Couverture" valeur={r.d > 0 ? `${formatNombre(r.stock / r.d, 0)} j` : '—'} sousTexte="au rythme actuel" />
          </GrilleIndicateurs>

          {r.en_alerte ? (
            <Encart
              ton="danger"
              icone={TriangleAlert}
              action={
                matiere?.commande_en_cours ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/gerant/commandes?etat=EN_ATTENTE">
                      <ClipboardList /> Voir la commande
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" asChild>
                    <Link to={`/gerant/commander?produit=${idProduit}`}>Commander {formatNombre(r.Q)} unités</Link>
                  </Button>
                )
              }
            >
              Stock sous le point de commande{matiere?.commande_en_cours ? ' — une commande est déjà en cours.' : ' : il faut commander.'}
            </Encart>
          ) : (
            <Encart ton="ok">
              Stock suffisant : {formatNombre(r.stock)} au-dessus du point de commande ({formatNombre(r.PC)}).
            </Encart>
          )}

          <Carte sansPadding className="gap-0 overflow-hidden">
            <div className="p-[22px] pb-4">
              <CarteEntete
                titre="Détail du calcul"
                description={`${formatNombre(r.total_consomme)} ${matiere?.unite ?? 'unités'} consommé(e)s en ${r.periode} jours · S = ${formatMontant(r.S)} · H = ${formatMontant(r.H)} · L = ${r.L} j · j = ${r.j} j`}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="border-y border-line bg-surf2 text-[12px] font-semibold tracking-[0.04em] text-mutedtxt uppercase">
                  <tr>
                    <th className="h-[42px] px-3 pl-[22px] text-left">Grandeur</th>
                    <th className="px-3 text-left">Formule</th>
                    <th className="px-3 text-right">Actuel · {r.periode} j</th>
                    <th className="px-3 pr-[22px] text-right">Simulation · {periodeSimulee} j</th>
                  </tr>
                </thead>
                <tbody>
                  {LIGNES.map((ligne) => {
                    const va = valeur(ligne, r)
                    const vs = calculable(s) ? valeur(ligne, s) : null
                    const different = vs !== null && va !== null && Math.abs(vs - va) > 1e-9
                    return (
                      <tr key={ligne.cle} className="border-b border-line3 last:border-0">
                        <td className="h-[52px] px-3 pl-[22px] font-semibold text-ink">{ligne.libelle}</td>
                        <td className="px-3 font-mono text-[13px] text-mutedtxt">{ligne.formule}</td>
                        <td className={cn('px-3 text-right tabular', ligne.fort && 'font-semibold')}>{va === null ? '—' : ligne.format(va)}</td>
                        <td className={cn('px-3 pr-[22px] text-right tabular', different ? 'font-semibold text-ifg' : 'text-ink', ligne.fort && 'font-semibold')}>
                          {simulation.isPending ? '…' : vs === null ? (s?.message ?? '—') : ligne.format(vs)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Carte>
        </>
      )}
    </Page>
  )
}
