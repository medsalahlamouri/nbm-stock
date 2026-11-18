/*
 * Carte cliquable d'une commande fournisseur en attente (factures fournisseur, tableau de bord du chef) :
 * référence, état de livraison, matière, fournisseur, quantité et montant.
 */
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { formatMontant, formatNombre, reference } from '@/lib/format'
import { etatCommande } from '@/lib/etats'
import { BadgeEtat } from '@/components/commun/Badge'
import { elementCascade } from '@/components/commun/animations'

/** Carte cliquable d'une commande à réceptionner */
export function CarteCommande({ commande, actif, to, onClick }) {
  const contenu = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-ink font-mono text-[14px] font-semibold">
          {reference('CMD', commande.id_commande)}
        </p>
        <BadgeEtat etat={etatCommande(commande)} />
      </div>
      <p className="text-ink mt-2 truncate text-[15px] font-semibold">
        {commande.devis?.produit?.designation}
      </p>
      <p className="text-mutedtxt truncate text-[13px]">
        {commande.devis?.fournisseur?.raison_sociale}
      </p>
      <p className="text-ink3 tabular mt-2 text-[13px]">
        {formatNombre(commande.quantite)} {commande.devis?.produit?.unite} ·{' '}
        {formatMontant(commande.montant)}
      </p>
    </>
  )
  const classes = `block rounded-xl border px-4 py-3.5 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-hover ${actif ? 'border-ink bg-surf ring-1 ring-ink' : 'border-line bg-surf2 hover:border-line2'}`
  return (
    <motion.div variants={elementCascade.variants}>
      {to ? (
        <Link to={to} className={classes}>
          {contenu}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={actif}
          className={`${classes} w-full cursor-pointer`}
        >
          {contenu}
        </button>
      )}
    </motion.div>
  )
}
