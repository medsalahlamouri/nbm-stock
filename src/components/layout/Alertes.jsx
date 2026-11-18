/*
 * Bouton « Alertes » de l'en-tête (cloche avec pastille rouge) et son panneau déroulant :
 * produits en alerte, commandes en retard (gérant), commandes à réceptionner (chef).
 */
import { Link } from 'react-router'
import { Armchair, Bell, Clock, Inbox, Layers } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAlertes } from '@/hooks/useCompteurs'
import { reference, formatNombre } from '@/lib/format'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/commun/Badge'
import { etatStock } from '@/lib/etats'
import { Pastille } from '@/components/commun/StatCard'
import { Skeleton } from '@/components/ui/skeleton'

function Ligne({ to, icone, ton, titre, detail, badge }) {
  return (
    <li>
      <Link
        to={to}
        className="hover:bg-surf2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
      >
        <Pastille icone={icone} ton={ton} taille={32} />
        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-[13px] font-semibold">{titre}</span>
          <span className="text-mutedtxt block truncate text-[12px]">{detail}</span>
        </span>
        {badge}
      </Link>
    </li>
  )
}

export function Alertes() {
  const { utilisateur } = useAuth()
  const profil = utilisateur?.profil
  const gerant = profil === 'GERANT'
  const { data, isPending } = useAlertes(profil)
  const total =
    (data?.stock.length ?? 0) + (data?.retards.length ?? 0) + (data?.aReceptionner.length ?? 0)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={total > 0 ? `Alertes : ${total}` : 'Alertes'}
          className="border-line bg-surf text-ink hover:bg-surf2 relative inline-flex size-[38px] cursor-pointer items-center justify-center rounded-[10px] border transition-colors active:scale-95"
        >
          <Bell className="size-[18px]" />
          {total > 0 && (
            <span
              className="bg-red ring-surf absolute top-2 right-2 size-2 rounded-full ring-2"
              aria-hidden="true"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-24px)] rounded-[14px] p-0">
        <div className="border-line border-b px-4 py-3">
          <p className="text-ink text-[14px] font-semibold">Alertes</p>
          <p className="text-mutedtxt text-[12px]">
            {total > 0
              ? `${formatNombre(total)} élément(s) demandent votre attention`
              : 'Rien à signaler'}
          </p>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {isPending ? (
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : total === 0 ? (
            <p className="text-mutedtxt px-3 py-6 text-center text-[13px]">
              Aucun produit en alerte, aucune commande en retard.
            </p>
          ) : (
            <ul className="flex flex-col">
              {data.retards.map((r) => (
                <Ligne
                  key={`r${r.id_commande}`}
                  to={`/gerant/commandes/${r.id_commande}`}
                  icone={Clock}
                  ton="danger"
                  titre={`${reference('CMD', r.id_commande)} · ${r.designation}`}
                  detail={r.raison_sociale}
                  badge={<Badge ton="danger">En retard · {r.jours_retard} j</Badge>}
                />
              ))}
              {data.aReceptionner.map((c) => (
                <Ligne
                  key={`c${c.id_commande}`}
                  to={`/chef/factures-fournisseur/nouvelle?commande=${c.id_commande}`}
                  icone={Inbox}
                  ton="warn"
                  titre={`${reference('CMD', c.id_commande)} · ${c.devis?.produit?.designation ?? ''}`}
                  detail={`À réceptionner · ${c.devis?.fournisseur?.raison_sociale ?? ''}`}
                />
              ))}
              {data.stock.map((p) => {
                const etat = etatStock(p.etat)
                const to = gerant
                  ? p.type === 'MP' && p.etat === 'A_COMMANDER'
                    ? `/gerant/commander?produit=${p.id_produit}`
                    : p.type === 'MP'
                      ? '/gerant/stock/matieres'
                      : '/gerant/stock/articles'
                  : `/chef/produits/${p.id_produit}`
                return (
                  <Ligne
                    key={`p${p.id_produit}`}
                    to={to}
                    icone={p.type === 'MP' ? Layers : Armchair}
                    ton={etat.ton}
                    titre={p.designation}
                    detail={`Stock ${formatNombre(p.quantite_stock)} · ${p.type === 'MP' ? 'point de commande' : 'seuil minimum'} ${formatNombre(p.seuil)}`}
                    badge={<Badge ton={etat.ton}>{etat.libelle}</Badge>}
                  />
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
