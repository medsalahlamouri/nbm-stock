/*
 * B9 — Paramètres de calcul (/gerant/parametres).
 * Liste des matières premières actives ; pour la matière choisie : S (coût de commande, DT > 0),
 * H (coût de détention, DT > 0), L (délai, jours ≥ 0), j (jours de sécurité ≥ 0), période d'analyse (7–365).
 * update produit (paramètres uniquement) : Q* et PC sont recalculés par le serveur, puis relus et affichés.
 */
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { Calculator, CircleAlert, CircleCheck, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { listerProduits, modifierParametres } from '@/api/stock'
import { correspond, formatMontant, formatNombre } from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { nombre } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, Tuile } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Encart } from '@/components/commun/Encart'
import { Recherche } from '@/components/commun/Recherche'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { PiedFormulaire, compterModifies } from '@/components/commun/Formulaire'

const schema = z.object({
  coutCommande: nombre('Saisissez S.').refine((v) => v > 0, 'S doit être supérieur à 0.'),
  coutDetention: nombre('Saisissez H.').refine((v) => v > 0, 'H doit être supérieur à 0.'),
  delaiLivraison: nombre('Saisissez L.').refine((v) => Number.isInteger(v) && v >= 0, 'Nombre entier de jours, 0 ou plus.'),
  joursSecurite: nombre('Saisissez j.').refine((v) => Number.isInteger(v) && v >= 0, 'Nombre entier de jours, 0 ou plus.'),
  periodeAnalyse: nombre('Saisissez la période.').refine((v) => Number.isInteger(v) && v >= 7 && v <= 365, 'Entre 7 et 365 jours.'),
})

const complet = (p) => [p.cout_commande, p.cout_detention, p.delai_livraison, p.jours_securite].every((v) => v !== null && v !== undefined)
const texte = (v) => (v === null || v === undefined ? '' : String(v))

function FormulaireParametres({ produit, onEnregistre }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      coutCommande: texte(produit.cout_commande),
      coutDetention: texte(produit.cout_detention),
      delaiLivraison: texte(produit.delai_livraison),
      joursSecurite: texte(produit.jours_securite),
      periodeAnalyse: texte(produit.periode_analyse ?? 90),
    },
  })

  const soumettre = async (v) => {
    try {
      const misAJour = await modifierParametres(produit.id_produit, v)
      await invalider('stock', 'achats')
      toast.success(`Paramètres enregistrés : Q* = ${formatNombre(misAJour.quantite_economique)}, PC = ${formatNombre(misAJour.point_commande)}.`)
      onEnregistre(misAJour)
    } catch (e) {
      toast.error(messageErreur(e))
    }
  }

  return (
    <form onSubmit={handleSubmit(soumettre)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <Champ libelle="S · coût de passation d'une commande (DT)" obligatoire erreur={errors.coutCommande?.message} modifie={dirtyFields.coutCommande}>
          <Input inputMode="decimal" {...register('coutCommande')} />
        </Champ>
        <Champ libelle="H · coût de détention annuel d'une unité (DT)" obligatoire erreur={errors.coutDetention?.message} modifie={dirtyFields.coutDetention}>
          <Input inputMode="decimal" {...register('coutDetention')} />
        </Champ>
        <Champ libelle="L · délai de livraison (jours)" obligatoire erreur={errors.delaiLivraison?.message} aide="Mis à jour aussi à chaque commande passée" modifie={dirtyFields.delaiLivraison}>
          <Input inputMode="numeric" {...register('delaiLivraison')} />
        </Champ>
        <Champ libelle="j · jours de sécurité" obligatoire erreur={errors.joursSecurite?.message} modifie={dirtyFields.joursSecurite}>
          <Input inputMode="numeric" {...register('joursSecurite')} />
        </Champ>
        <Champ libelle="Période d'analyse (jours)" obligatoire erreur={errors.periodeAnalyse?.message} aide="Consommation observée sur cette période (7 à 365, 90 par défaut)" modifie={dirtyFields.periodeAnalyse}>
          <Input inputMode="numeric" {...register('periodeAnalyse')} />
        </Champ>
      </div>
      <PiedFormulaire modification nbModifies={compterModifies(dirtyFields)} enCours={isSubmitting} onAnnuler={() => reset()} libelle="Enregistrer et recalculer" />
    </form>
  )
}

export default function Parametres() {
  const [parametres, setParametres] = useSearchParams()
  const [recherche, setRecherche] = useState('')
  const [dernierCalcul, setDernierCalcul] = useState(null)
  const produits = useQuery({ queryKey: ['produits'], queryFn: listerProduits })
  const matieres = useMemo(() => (produits.data ?? []).filter((p) => p.type === 'MP' && p.actif), [produits.data])
  const idChoisi = Number(parametres.get('produit')) || matieres[0]?.id_produit
  const produit = matieres.find((p) => p.id_produit === idChoisi)
  const visibles = matieres.filter((p) => correspond(recherche, p.code, p.designation))

  if (produits.isError) return <Carte><EtatErreur erreur={produits.error} onReessayer={produits.refetch} /></Carte>

  return (
    <Page>
      <PageEntete
        titre="Paramètres de calcul"
        description="Coûts et délais de chaque matière première. Après enregistrement, le serveur recalcule la quantité économique Q* et le point de commande PC."
        actions={
          produit && (
            <Button variant="outline" asChild>
              <Link to={`/gerant/calcul?produit=${produit.id_produit}`}>
                <Calculator /> Voir le détail du calcul
              </Link>
            </Button>
          )
        }
      />
      {produits.isPending ? (
        <SqueletteBloc hauteur={320} />
      ) : matieres.length === 0 ? (
        <Carte>
          <EtatVide icone={SlidersHorizontal} titre="Aucune matière première active" message="Le chef magasin crée les matières premières dans « Produits »." />
        </Carte>
      ) : (
        <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(280px,1fr)_2fr]">
          <Carte className="gap-3">
            <CarteEntete titre="Matières premières" description={`${formatNombre(matieres.length)} matière(s) active(s)`} />
            <Recherche valeur={recherche} onChange={setRecherche} placeholder="Code ou désignation" className="max-w-none" />
            <ul className="-mx-2 flex max-h-[520px] flex-col gap-0.5 overflow-y-auto">
              {visibles.map((p) => {
                const actif = p.id_produit === idChoisi
                return (
                  <li key={p.id_produit}>
                    <button
                      type="button"
                      onClick={() => {
                        setDernierCalcul(null)
                        setParametres({ produit: String(p.id_produit) }, { replace: true })
                      }}
                      aria-current={actif || undefined}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        actif ? 'bg-hl ring-1 ring-gold2/50' : 'hover:bg-surf2',
                      )}
                    >
                      {complet(p) ? <CircleCheck className="size-4 shrink-0 text-okfg" aria-label="Paramètres complets" /> : <CircleAlert className="size-4 shrink-0 text-wfg" aria-label="Paramètres incomplets" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">{p.designation}</span>
                        <span className="block text-[12px] text-mutedtxt">
                          {p.code} · Q* {p.quantite_economique ?? '—'} · PC {p.point_commande ?? '—'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Carte>

          {produit && (
            <Carte key={produit.id_produit}>
              <CarteEntete
                titre={produit.designation}
                description={`${produit.code} · unité : ${produit.unite} · stock ${formatNombre(produit.quantite_stock)}`}
                action={complet(produit) ? <Badge ton="ok">Paramètres complets</Badge> : <Badge ton="warn">Paramètres incomplets</Badge>}
              />
              <div className="grid grid-cols-2 gap-3">
                <motion.div key={`q-${produit.quantite_economique}`} initial={dernierCalcul ? { scale: 0.96 } : false} animate={{ scale: 1 }}>
                  <Tuile libelle="Quantité économique Q* (actuelle)" valeur={produit.quantite_economique !== null ? formatNombre(produit.quantite_economique) : '—'} className={dernierCalcul ? 'border-gold2 bg-hl' : ''} />
                </motion.div>
                <motion.div key={`pc-${produit.point_commande}`} initial={dernierCalcul ? { scale: 0.96 } : false} animate={{ scale: 1 }}>
                  <Tuile libelle="Point de commande PC (actuel)" valeur={produit.point_commande !== null ? formatNombre(produit.point_commande) : '—'} className={dernierCalcul ? 'border-gold2 bg-hl' : ''} />
                </motion.div>
              </div>
              {!complet(produit) && (
                <Encart ton="warn">Tant que S, H, L et j ne sont pas tous renseignés, Q* et le PC ne peuvent pas être calculés et la matière ne déclenche pas d'alerte.</Encart>
              )}
              {produit.cout_commande !== null && (
                <p className="text-[13px] text-mutedtxt">
                  Valeurs enregistrées : S = {formatMontant(produit.cout_commande)} · H = {formatMontant(produit.cout_detention)} · L = {produit.delai_livraison ?? '—'} j · j = {produit.jours_securite ?? '—'} j · période {produit.periode_analyse} j
                </p>
              )}
              <FormulaireParametres produit={produit} onEnregistre={setDernierCalcul} />
            </Carte>
          )}
        </div>
      )}
    </Page>
  )
}
