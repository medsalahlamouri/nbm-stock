/*
 * C5 — Nouveau mouvement (/chef/mouvements/nouveau).
 * 1. Type de produit  2. Produit (combobox)  3. Motif déduit par le serveur
 * (MP → sortie « Consommation atelier », article → entrée « Production atelier »)  4. Quantité.
 * Aperçu stock avant → après, refus en direct si la sortie dépasse le stock, alerte au PC / seuil.
 * rpc('enregistrer_mouvement') → toast avec le nouveau stock. Un mouvement enregistré n'est jamais modifiable :
 * les corrections passent par l'inventaire.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Armchair, Check, Info, Layers, Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { enregistrerMouvement } from '@/api/stock'
import { useEtatStock } from '@/hooks/useDonnees'
import { formatNombre } from '@/lib/format'
import { etatStock } from '@/lib/etats'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, Tuile } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Combobox } from '@/components/commun/Combobox'
import { Encart } from '@/components/commun/Encart'

function Etape({ numero, titre, description, children }) {
  return (
    <Carte>
      <div className="flex items-start gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-strong text-[14px] font-semibold text-bg">{numero}</span>
        <div className="pt-1">
          <h2 className="text-[17px] leading-tight font-semibold text-ink">{titre}</h2>
          {description && <p className="mt-0.5 text-[13px] text-mutedtxt">{description}</p>}
        </div>
      </div>
      {children}
    </Carte>
  )
}

const TYPES = [
  { valeur: 'MP', titre: 'Matière première', detail: 'Bois, panneaux, quincaillerie, colle, vernis', icone: Layers },
  { valeur: 'ARTICLE', titre: 'Article (produit fini)', detail: 'Tables, chaises, armoires, bureaux', icone: Armchair },
]

export default function MouvementFormulaire() {
  const naviguer = useNavigate()
  const [parametres] = useSearchParams()
  const stock = useEtatStock()
  const produits = (stock.data ?? []).filter((p) => p.actif)
  const initial = produits.find((p) => p.id_produit === Number(parametres.get('produit')))
  const [type, setType] = useState(initial?.type ?? (parametres.get('type') === 'ARTICLE' ? 'ARTICLE' : 'MP'))
  const [idProduit, setIdProduit] = useState(initial?.id_produit ?? null)
  const [quantite, setQuantite] = useState('')

  const duType = produits.filter((p) => p.type === type)
  const produit = duType.find((p) => p.id_produit === idProduit) ?? (initial?.type === type ? initial : null)
  const mp = type === 'MP'
  const qte = Number(quantite)
  const qteValide = quantite !== '' && Number.isInteger(qte) && qte > 0
  const apres = produit && qteValide ? produit.quantite_stock + (mp ? -qte : qte) : null
  const insuffisant = mp && produit && qteValide && qte > produit.quantite_stock
  const seuil = produit?.seuil
  const alerte = apres !== null && !insuffisant && seuil !== null && seuil !== undefined && apres <= seuil

  const mouvement = useMutation({
    mutationFn: () => enregistrerMouvement(produit.id_produit, qte),
    onSuccess: async (resultat) => {
      await invalider('stock')
      toast.success(`Mouvement enregistré : nouveau stock ${formatNombre(resultat?.nouveau_stock)} ${produit.unite}.`, {
        description: `${resultat?.motif ?? (mp ? 'Consommation atelier' : 'Production atelier')} · ${produit.designation}`,
      })
      if (resultat?.en_alerte) {
        toast.warning(mp ? `${produit.designation} a atteint son point de commande.` : `${produit.designation} est sous son seuil minimum.`, {
          description: mp ? 'Le gérant est alerté pour commander.' : 'Pensez à lancer une production.',
        })
      }
      naviguer('/chef/mouvements?type=' + type)
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const options = duType.map((p) => ({
    valeur: p.id_produit,
    libelle: p.designation,
    sousLibelle: p.code,
    droite: `${formatNombre(p.quantite_stock)} ${p.unite}`,
  }))

  return (
    <Page>
      <PageEntete
        titre="Nouveau mouvement"
        description="Indiquez d'abord s'il s'agit d'une matière première ou d'un article : le produit proposé et le motif en dépendent."
      />

      <Etape numero={1} titre="Type de produit">
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Type de produit">
          {TYPES.map((t) => {
            const actif = t.valeur === type
            return (
              <button
                key={t.valeur}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => {
                  setType(t.valeur)
                  setIdProduit(null)
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 text-left transition-[background-color,border-color,color] duration-200 active:scale-[0.99]',
                  actif ? 'border-strong bg-strong text-bg' : 'border-line bg-surf text-ink hover:border-line2',
                )}
              >
                <span className={cn('inline-flex size-11 shrink-0 items-center justify-center rounded-[10px]', actif ? 'bg-bg/10' : 'bg-hl text-ink')}>
                  <t.icone className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold">{t.titre}</span>
                  <span className={cn('block text-[13px]', actif ? 'text-bg/75' : 'text-mutedtxt')}>{t.detail}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Etape>

      <Etape numero={2} titre="Produit" description={`${formatNombre(duType.length)} ${mp ? 'matière(s) première(s)' : 'article(s)'} · recherche par code ou nom`}>
        <Combobox
          libelle="Produit"
          valeur={produit?.id_produit ?? null}
          onChange={setIdProduit}
          options={options}
          placeholder={stock.isPending ? 'Chargement…' : 'Rechercher un produit'}
          recherchePlaceholder="Code ou désignation…"
          effacable
        />
        {produit && produit.etat !== 'SUFFISANT' && (
          <p className="text-[13px] text-mutedtxt">
            État actuel : <Badge ton={etatStock(produit.etat).ton}>{etatStock(produit.etat).libelle}</Badge>
          </p>
        )}
      </Etape>

      <Etape numero={3} titre="Motif" description="Déduit du type de produit. Réceptions, ventes, inventaires et stock initial sont créés automatiquement ailleurs.">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-ink bg-hl px-5 py-4">
          <div>
            <p className="text-[16px] font-semibold text-ink">{mp ? 'Consommation atelier' : 'Production atelier'}</p>
            <p className="text-[13px] text-mutedtxt">{mp ? "Matière remise à l'atelier pour la fabrication" : "Articles terminés par l'atelier et entrés en stock"}</p>
          </div>
          <Badge ton={mp ? 'danger' : 'ok'}>{mp ? 'Sortie' : 'Entrée'}</Badge>
        </div>
        <Encart ton="info" icone={Info}>
          Les réceptions et les ventes sont enregistrées automatiquement par les factures. Un mouvement enregistré n'est jamais modifiable : pour corriger un écart, utilisez l'
          <Link to="/chef/inventaire" className="font-semibold underline underline-offset-2">
            inventaire
          </Link>
          .
        </Encart>
      </Etape>

      <Etape numero={4} titre="Quantité">
        <Champ
          libelle={`Quantité${produit ? ` (${produit.unite})` : ''}`}
          obligatoire
          className="max-w-[360px]"
          erreur={quantite !== '' && !qteValide ? 'Saisissez un nombre entier supérieur à 0.' : insuffisant ? `Stock insuffisant : ${formatNombre(produit.quantite_stock)} ${produit.unite} disponible(s).` : undefined}
        >
          <Input inputMode="numeric" placeholder="0" value={quantite} onChange={(e) => setQuantite(e.target.value.replace(/[^\d]/g, ''))} disabled={!produit} />
        </Champ>
        <div className="grid gap-3 sm:grid-cols-3">
          <Tuile libelle="Stock actuel" valeur={produit ? `${formatNombre(produit.quantite_stock)} ${produit.unite}` : '—'} />
          <div className={cn('rounded-xl px-4 py-3.5', insuffisant ? 'bg-dbg text-dfg' : 'bg-strong text-bg')}>
            <p className="text-[13px] opacity-75">Stock après le mouvement</p>
            <p className="mt-1 text-[22px] leading-tight font-semibold tabular">{apres !== null ? `${formatNombre(apres)} ${produit.unite}` : '—'}</p>
          </div>
          <Tuile libelle={mp ? 'Point de commande' : 'Seuil minimum'} valeur={seuil !== null && seuil !== undefined ? formatNombre(seuil) : '—'} />
        </div>
        {alerte && (
          <Encart ton="warn" icone={TriangleAlert}>
            {mp
              ? `Après ce mouvement, le stock atteindra le point de commande (${formatNombre(seuil)}) : une alerte sera affichée au gérant.`
              : `Après ce mouvement, le stock restera sous le seuil minimum (${formatNombre(seuil)}).`}
          </Encart>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-[14px] text-mutedtxt">
            Récapitulatif :{' '}
            {produit && qteValide ? (
              <strong className="text-ink">
                {mp ? 'Sortie' : 'Entrée'} de {formatNombre(qte)} {produit.unite} · {produit.designation} · {mp ? 'Consommation atelier' : 'Production atelier'}
              </strong>
            ) : (
              'choisissez un produit et une quantité'
            )}
          </p>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => naviguer('/chef/mouvements')}>
              Annuler
            </Button>
            <Button onClick={() => mouvement.mutate()} disabled={!produit || !qteValide || insuffisant || mouvement.isPending}>
              {mouvement.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              Enregistrer le mouvement
            </Button>
          </div>
        </div>
      </Etape>
    </Page>
  )
}
