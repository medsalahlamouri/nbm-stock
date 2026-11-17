/*
 * B7 — Comparer les devis et commander (/gerant/commander?produit=id).
 * Choix de la matière première → synthèse (stock, PC, Q*, état, couverture) → comparaison des devis
 * des fournisseurs actifs (« Moins cher » présélectionné, « Plus rapide ») → quantité (Q* par défaut)
 * → confirmation → rpc('passer_commande').
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { FileText, Info, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { passerCommande } from '@/api/achats'
import { useDevis, useEtatStock } from '@/hooks/useDonnees'
import { formatDate, formatMontant, formatNombre, reference } from '@/lib/format'
import { etatStock } from '@/lib/etats'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, LigneInfo, Tuile } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Combobox } from '@/components/commun/Combobox'
import { Encart } from '@/components/commun/Encart'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { ConfirmDialog } from '@/components/commun/Dialogues'
import { elementCascade, listeCascade } from '@/components/commun/animations'

function ajouterJours(jours) {
  const d = new Date()
  d.setDate(d.getDate() + Number(jours))
  return d
}

/** Comparaison et commande pour une matière donnée (remonté à chaque changement de matière) */
function Comparaison({ matiere, devis }) {
  const naviguer = useNavigate()
  const tries = useMemo(() => [...devis].sort((a, b) => a.prix_unitaire - b.prix_unitaire || a.delai_livraison - b.delai_livraison), [devis])
  const moinsCher = tries[0]?.id_devis
  const delaiMin = Math.min(...tries.map((d) => d.delai_livraison))
  const plusRapide = tries.filter((d) => d.delai_livraison === delaiMin).sort((a, b) => a.prix_unitaire - b.prix_unitaire)[0]?.id_devis
  const [choisi, setChoisi] = useState(moinsCher)
  const [quantite, setQuantite] = useState(matiere.quantite_economique ? String(matiere.quantite_economique) : '')
  const [confirmee, setConfirmee] = useState(false)
  const [ouvert, setOuvert] = useState(false)

  const qte = Number(quantite)
  const qteValide = Number.isInteger(qte) && qte > 0
  const devisChoisi = tries.find((d) => d.id_devis === choisi)
  const total = qteValide && devisChoisi ? qte * devisChoisi.prix_unitaire : 0

  const commande = useMutation({
    mutationFn: () => passerCommande(choisi, qte),
    onSuccess: async (idCommande) => {
      await invalider('achats', 'stock')
      toast.success(`Commande ${reference('CMD', idCommande)} passée.`, {
        description: `${formatNombre(qte)} ${matiere.unite} · ${devisChoisi.fournisseur.raison_sociale} · ${formatMontant(total)}`,
        action: { label: 'Voir', onClick: () => naviguer(`/gerant/commandes/${idCommande}`) },
      })
      naviguer(`/gerant/commandes/${idCommande}`)
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  if (tries.length === 0) {
    return (
      <Carte>
        <EtatVide
          icone={FileText}
          titre="Aucun devis pour cette matière"
          message="Saisissez au moins un devis d'un fournisseur actif pour pouvoir commander."
          action={
            <Button asChild>
              <Link to={`/gerant/devis/nouveau?produit=${matiere.id_produit}`}>
                <Plus /> Ajouter un devis
              </Link>
            </Button>
          }
        />
      </Carte>
    )
  }

  return (
    <Carte>
      <CarteEntete
        titre="Devis comparés"
        description="Livraison prévue = aujourd'hui + délai du devis"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/gerant/devis/nouveau?produit=${matiere.id_produit}`}>
              <Plus /> Ajouter un devis
            </Link>
          </Button>
        }
      />
      <motion.div role="radiogroup" aria-label="Devis" className="flex flex-col gap-3" {...listeCascade}>
        {tries.map((d) => {
          const actif = d.id_devis === choisi
          return (
            <motion.label
              key={d.id_devis}
              variants={elementCascade.variants}
              className={cn(
                'grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-xl border px-5 py-4 transition-[border-color,background-color,box-shadow] md:grid-cols-[auto_minmax(0,1.6fr)_1fr_1.2fr_1fr]',
                actif ? 'border-ink bg-surf shadow-card ring-1 ring-ink' : 'border-line bg-surf2 hover:border-line2',
              )}
            >
              <input
                type="radio"
                name="devis"
                value={d.id_devis}
                checked={actif}
                onChange={() => setChoisi(d.id_devis)}
                className="size-5 cursor-pointer accent-[var(--strong)]"
              />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-ink">{d.fournisseur.raison_sociale}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-mutedtxt">
                  {d.id_devis === moinsCher && <Badge ton="ok">Moins cher</Badge>}
                  {d.id_devis === plusRapide && tries.length > 1 && <Badge ton="info">Plus rapide</Badge>}
                  <span>
                    Devis {reference('DEV', d.id_devis)} du {formatDate(d.date_devis)}
                  </span>
                </div>
              </div>
              <div className="col-start-2 md:col-start-auto">
                <p className="text-[12px] text-mutedtxt">Prix unitaire</p>
                <p className="text-[15px] font-semibold text-ink tabular">{formatMontant(d.prix_unitaire)}</p>
              </div>
              <div className="col-start-2 md:col-start-auto">
                <p className="text-[12px] text-mutedtxt">Livraison prévue</p>
                <p className="text-[15px] font-semibold text-ink tabular">
                  {formatDate(ajouterJours(d.delai_livraison))} ({d.delai_livraison} j)
                </p>
              </div>
              <div className="col-start-2 md:col-start-auto">
                <p className="text-[12px] text-mutedtxt">Montant</p>
                <p className="text-[15px] font-semibold text-ink tabular">{qteValide ? formatMontant(qte * d.prix_unitaire) : '—'}</p>
              </div>
            </motion.label>
          )
        })}
      </motion.div>

      <div className="grid gap-5 border-t border-line pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex flex-col gap-3">
          <Champ
            libelle="Quantité convenue avec le fournisseur"
            erreur={quantite && !qteValide ? 'Saisissez un nombre entier supérieur à 0.' : undefined}
            aide={
              matiere.quantite_economique
                ? `Point de départ : Q* = ${formatNombre(matiere.quantite_economique)}. La quantité se négocie avec le fournisseur (téléphone, e-mail) ; saisissez celle qu'il a acceptée.`
                : "Q* n'est pas calculée (paramètres incomplets) : saisissez la quantité négociée avec le fournisseur."
            }
            className="max-w-[340px]"
          >
            <Input
              inputMode="numeric"
              value={quantite}
              onChange={(e) => {
                setQuantite(e.target.value.replace(/[^\d]/g, ''))
                setConfirmee(false)
              }}
            />
          </Champ>
          <label className="flex max-w-[620px] cursor-pointer items-center gap-3 rounded-xl border border-line2 px-4 py-3 text-[14px] text-ink">
            <Checkbox checked={confirmee} onCheckedChange={(v) => setConfirmee(Boolean(v))} disabled={!qteValide} />
            Quantité confirmée par le fournisseur
          </label>
        </div>
        <div className="flex flex-wrap items-end justify-end gap-5">
          <div className="text-right">
            <p className="text-[13px] text-mutedtxt">Total de la commande</p>
            <p className="font-serif text-[30px] leading-tight font-semibold text-strong tabular">{formatMontant(total)}</p>
          </div>
          <Button size="lg" disabled={!qteValide || !confirmee || !devisChoisi} onClick={() => setOuvert(true)}>
            {commande.isPending && <Loader2 className="animate-spin" />}
            Passer la commande
          </Button>
        </div>
      </div>

      <ConfirmDialog
        ouvert={ouvert}
        onOuvertChange={setOuvert}
        ton="principal"
        titre="Passer la commande ?"
        libelleConfirmer="Passer la commande"
        onConfirmer={() => commande.mutateAsync()}
      >
        {devisChoisi && (
          <dl className="rounded-xl border border-line bg-surf2 px-4 py-2">
            <LigneInfo libelle="Matière première">{matiere.designation}</LigneInfo>
            <LigneInfo libelle="Fournisseur">{devisChoisi.fournisseur.raison_sociale}</LigneInfo>
            <LigneInfo libelle="Quantité">
              {formatNombre(qte)} {matiere.unite}
            </LigneInfo>
            <LigneInfo libelle="Prix unitaire">{formatMontant(devisChoisi.prix_unitaire)}</LigneInfo>
            <LigneInfo libelle="Livraison prévue">{formatDate(ajouterJours(devisChoisi.delai_livraison))}</LigneInfo>
            <LigneInfo libelle="Total" fort>
              {formatMontant(total)}
            </LigneInfo>
          </dl>
        )}
      </ConfirmDialog>
    </Carte>
  )
}

export default function Commander() {
  const [parametres, setParametres] = useSearchParams()
  const idProduit = parametres.get('produit') ? Number(parametres.get('produit')) : null
  const stock = useEtatStock()
  const devis = useDevis()

  const matieres = (stock.data ?? []).filter((p) => p.type === 'MP' && p.actif)
  const matiere = matieres.find((p) => p.id_produit === idProduit)
  const devisMatiere = (devis.data ?? []).filter((d) => d.produit.id_produit === idProduit && d.fournisseur.actif)
  const options = matieres.map((p) => {
    const etat = etatStock(p.etat)
    return { valeur: p.id_produit, libelle: p.designation, sousLibelle: p.code, droite: etat.libelle }
  })

  return (
    <Page>
      <PageEntete
        titre="Comparer les devis et commander"
        description="Choisissez une matière première : ses devis sont comparés et le moins cher est présélectionné. La quantité Q* sert de point de départ ; la quantité finale est négociée avec le fournisseur puis confirmée."
      />
      <Carte>
        <Champ libelle="Matière première" className="max-w-[560px]">
          <Combobox
            valeur={idProduit}
            onChange={(v) => setParametres(v ? { produit: String(v) } : {}, { replace: true })}
            options={options}
            placeholder={stock.isPending ? 'Chargement…' : 'Rechercher une matière première'}
            recherchePlaceholder="Code ou désignation…"
            effacable
          />
        </Champ>
        {stock.isError && <EtatErreur erreur={stock.error} onReessayer={stock.refetch} />}
        {matiere && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tuile libelle="Stock actuel" valeur={`${formatNombre(matiere.quantite_stock)} ${matiere.unite}`} />
              <Tuile libelle="Point de commande" valeur={formatNombre(matiere.seuil)} />
              <Tuile libelle="Quantité économique Q*" valeur={formatNombre(matiere.quantite_economique)} />
              <Tuile
                libelle={`État${matiere.couverture_jours !== null ? ` · couverture ${formatNombre(matiere.couverture_jours, 0, 1)} j` : ''}`}
                valeur={etatStock(matiere.etat).libelle}
                ton={etatStock(matiere.etat).ton}
              />
            </div>
            {matiere.commande_en_cours && (
              <Encart ton="warn" titre="Une commande est déjà en attente pour cette matière">
                Vérifiez qu'une nouvelle commande est nécessaire avant de la passer.{' '}
                <Link to="/gerant/commandes?etat=EN_ATTENTE" className="font-semibold underline underline-offset-2">
                  Voir les commandes en attente
                </Link>
              </Encart>
            )}
          </>
        )}
      </Carte>

      {!idProduit ? (
        <Carte>
          <EtatVide icone={Info} titre="Choisissez une matière première" message="Ses devis s'afficheront ici, du moins cher au plus cher." />
        </Carte>
      ) : stock.isPending || devis.isPending ? (
        <SqueletteBloc hauteur={240} />
      ) : devis.isError ? (
        <Carte>
          <EtatErreur erreur={devis.error} onReessayer={devis.refetch} />
        </Carte>
      ) : !matiere ? (
        <Carte>
          <EtatVide titre="Matière première introuvable" message="Elle n'existe pas ou a été désactivée. Choisissez-en une autre." />
        </Carte>
      ) : (
        <Comparaison key={matiere.id_produit} matiere={matiere} devis={devisMatiere} />
      )}
    </Page>
  )
}
