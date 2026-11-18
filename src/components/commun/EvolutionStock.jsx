/*
 * Évolution du stock d'un produit (extension UC15) : courbe reconstituée à partir de mouvement_stock
 * (stock actuel, puis remontée des mouvements), ligne du point de commande (MP) ou du seuil minimum
 * (article) en pointillé, période 30 / 60 / 90 jours.
 * Utilisée par la fiche produit (C3) et les panneaux de détail des stocks du gérant (B2, B3).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { historiqueProduit, serieStock } from '@/api/stock'
import { formatDate, formatNombre } from '@/lib/format'
import { CarteEntete } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Onglets } from '@/components/commun/Onglets'
import { CourbeStock } from '@/components/commun/Graphiques'
import { EtatErreur } from '@/components/commun/Etats'
import { Skeleton } from '@/components/ui/skeleton'

const PERIODES = [
  { valeur: 30, libelle: '30 jours', pas: 3 },
  { valeur: 60, libelle: '60 jours', pas: 7 },
  { valeur: 90, libelle: '90 jours', pas: 7 },
]

/** Historique des mouvements d'un produit avec « stock après » (partagé par la courbe et le journal) */
// oxlint-disable-next-line react/only-export-components
export function useHistoriqueProduit(produit) {
  return useQuery({
    queryKey: ['courbe-stock', produit?.id_produit, produit?.quantite_stock],
    queryFn: () => historiqueProduit(produit.id_produit, produit.quantite_stock),
    enabled: Boolean(produit),
  })
}

export function EvolutionStock({ produit, compact = false }) {
  const [periode, setPeriode] = useState(90)
  const historique = useHistoriqueProduit(produit)
  const mp = produit.type === 'MP'
  const seuil = mp
    ? (produit.point_commande ?? produit.seuil)
    : (produit.seuil_minimum ?? produit.seuil)
  const enAlerte = seuil !== null && seuil !== undefined && produit.quantite_stock <= seuil

  const donnees = useMemo(() => {
    if (!historique.data) return []
    const pas = PERIODES.find((p) => p.valeur === periode)?.pas ?? 7
    return serieStock(historique.data, produit.quantite_stock, periode, pas).map((p) => ({
      ...p,
      libelle: formatDate(p.date).slice(0, 5),
      libelleComplet: formatDate(p.date),
    }))
  }, [historique.data, produit.quantite_stock, periode])

  return (
    <div className="flex flex-col gap-4">
      <CarteEntete
        titre="Évolution du stock"
        description="Stock en fin de journée, reconstitué à partir des mouvements"
        action={
          <Onglets
            options={PERIODES}
            valeur={periode}
            onChange={setPeriode}
            libelle="Période"
            taille="sm"
          />
        }
      />
      <div className="text-ink flex flex-wrap items-center gap-2 text-[14px]">
        <span>
          Aujourd'hui : <strong className="tabular">{formatNombre(produit.quantite_stock)}</strong>{' '}
          {produit.unite}
          {seuil !== null && seuil !== undefined && (
            <>
              {' '}
              · {mp ? 'point de commande' : 'seuil minimum'} :{' '}
              <strong className="tabular">{formatNombre(seuil)}</strong>
            </>
          )}
        </span>
        {enAlerte && <Badge ton="danger">Niveau d'alerte atteint</Badge>}
      </div>
      {historique.isPending ? (
        <Skeleton className={compact ? 'h-[220px]' : 'h-[280px]'} />
      ) : historique.isError ? (
        <EtatErreur erreur={historique.error} onReessayer={historique.refetch} />
      ) : (
        <CourbeStock
          donnees={donnees}
          seuil={seuil}
          libelleSeuil={mp ? 'PC' : 'Seuil'}
          unite={produit.unite}
          hauteur={compact ? 220 : 300}
        />
      )}
      <p className="text-mutedtxt flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
        <span>○ Stock en fin de journée</span>
        {seuil !== null && seuil !== undefined && (
          <span className="text-dfg">
            - - - {mp ? 'Point de commande' : 'Seuil minimum'} : {formatNombre(seuil)}
          </span>
        )}
        <span className="ml-auto">Survolez un point pour le détail</span>
      </p>
    </div>
  )
}
