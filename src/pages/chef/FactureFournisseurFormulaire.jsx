/*
 * C7bis — Saisir une facture fournisseur (/chef/factures-fournisseur/nouvelle?commande=id).
 * 1. Commande livrée (cartes des commandes en attente)  2. Facture reçue : n°, date, quantité,
 * prix unitaire, montant total, avec contrôle en direct (« Conforme » / écart) par rapport à la commande.
 * rpc('saisir_facture_fournisseur') : conforme → toast avec le nouveau stock ;
 * non conforme → encart rouge des écarts (champ, attendu, saisi) : rien n'est enregistré.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Check, Loader2, PackageCheck, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { saisirFactureFournisseur } from '@/api/achats'
import { useCommandes, useEtatStock } from '@/hooks/useDonnees'
import { dateISO, formatMontant, formatNombre, reference } from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Champ } from '@/components/commun/Champ'
import { Encart } from '@/components/commun/Encart'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { CarteCommande } from '@/components/commun/CarteCommande'
import { listeCascade } from '@/components/commun/animations'

const LIBELLES_CHAMPS = {
  quantite: 'Quantité',
  prix_unitaire: 'Prix unitaire',
  montant_total: 'Montant total',
  numero: 'Numéro',
  date: 'Date',
}
const versNombre = (v) =>
  v === '' || v === null || v === undefined
    ? NaN
    : Number(String(v).replace(/\s/g, '').replace(',', '.'))
const egal = (a, b) => Math.abs(a - b) < 0.0005

/** Champ numérique avec indicateur « Conforme » / écart intégré */
function ChampControle({ libelle, valeur, onChange, attendu, formater, inputMode = 'decimal' }) {
  const saisi = versNombre(valeur)
  const renseigne = !Number.isNaN(saisi)
  const conforme = renseigne && egal(saisi, attendu)
  return (
    <Champ libelle={libelle} obligatoire aide={`Attendu : ${formater(attendu)}`}>
      <div className="relative">
        <Input
          inputMode={inputMode}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'pr-32',
            renseigne && (conforme ? 'border-okfg/60' : 'border-dfg/60 bg-dbg/30'),
          )}
        />
        {renseigne && (
          <span className="absolute top-1/2 right-2 -translate-y-1/2">
            {conforme ? (
              <Badge ton="ok">Conforme</Badge>
            ) : (
              <Badge ton="danger">
                Écart {saisi > attendu ? '+' : '−'}
                {formater(Math.abs(saisi - attendu))}
              </Badge>
            )}
          </span>
        )}
      </div>
    </Champ>
  )
}

function Saisie({ commande, stockActuel }) {
  const naviguer = useNavigate()
  const p = commande.devis?.produit
  const attendu = {
    quantite: Number(commande.quantite),
    prix: Number(commande.devis?.prix_unitaire),
    montant: Math.round(commande.montant * 1000) / 1000,
  }
  const [numero, setNumero] = useState('')
  const [date, setDate] = useState(dateISO())
  const [quantite, setQuantite] = useState('')
  const [prix, setPrix] = useState('')
  const [montant, setMontant] = useState('')
  const [ecarts, setEcarts] = useState(null)

  const valeurs = {
    quantite: versNombre(quantite),
    prix: versNombre(prix),
    montant: versNombre(montant),
  }
  const complet =
    numero.trim() &&
    date &&
    !Number.isNaN(valeurs.quantite) &&
    !Number.isNaN(valeurs.prix) &&
    !Number.isNaN(valeurs.montant)
  const conforme =
    complet &&
    egal(valeurs.quantite, attendu.quantite) &&
    egal(valeurs.prix, attendu.prix) &&
    egal(valeurs.montant, attendu.montant)

  const saisie = useMutation({
    mutationFn: () =>
      saisirFactureFournisseur({
        idCommande: commande.id_commande,
        numero,
        date,
        quantite: valeurs.quantite,
        prixUnitaire: valeurs.prix,
        montantTotal: valeurs.montant,
      }),
    onSuccess: async (resultat) => {
      if (resultat?.conforme === false) {
        // Pas une erreur : la facture n'est simplement pas enregistrée
        setEcarts(resultat.ecarts ?? [])
        return
      }
      await invalider('receptions', 'stock')
      toast.success(
        `Facture enregistrée, nouveau stock : ${formatNombre(resultat?.nouveau_stock)} ${p?.unite}.`,
        {
          description: `${reference('CMD', commande.id_commande)} reçue · ${p?.designation}`,
        },
      )
      naviguer('/chef/factures-fournisseur')
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  return (
    <Carte
      as="form"
      onSubmit={(e) => {
        e.preventDefault()
        setEcarts(null)
        saisie.mutate()
      }}
      noValidate
    >
      <CarteEntete
        titre="2. Facture reçue"
        description={`Commande : ${formatNombre(attendu.quantite)} ${p?.unite} à ${formatMontant(attendu.prix)} · ${commande.devis?.fournisseur?.raison_sociale}`}
      />
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <Champ libelle="N° de facture" obligatoire>
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Numéro indiqué sur la facture"
            autoFocus
          />
        </Champ>
        <Champ libelle="Date de la facture" obligatoire>
          <Input
            type="date"
            value={date}
            max={dateISO()}
            min={commande.date_commande}
            onChange={(e) => setDate(e.target.value)}
          />
        </Champ>
        <ChampControle
          libelle="Quantité"
          valeur={quantite}
          onChange={setQuantite}
          attendu={attendu.quantite}
          formater={(v) => formatNombre(v)}
          inputMode="numeric"
        />
        <ChampControle
          libelle="Prix unitaire (DT)"
          valeur={prix}
          onChange={setPrix}
          attendu={attendu.prix}
          formater={formatMontant}
        />
        <ChampControle
          libelle="Montant total (DT)"
          valeur={montant}
          onChange={setMontant}
          attendu={attendu.montant}
          formater={formatMontant}
        />
      </div>

      {ecarts ? (
        <Encart
          ton="danger"
          icone={TriangleAlert}
          titre="Facture non conforme : rien n'a été enregistré"
        >
          <ul className="mt-1.5 flex flex-col gap-1">
            {ecarts.map((e) => (
              <li key={e.champ}>
                <strong>{LIBELLES_CHAMPS[e.champ] ?? e.champ}</strong> : attendu{' '}
                {e.champ === 'quantite' ? formatNombre(e.attendu) : formatMontant(e.attendu)}, saisi{' '}
                {e.champ === 'quantite' ? formatNombre(e.saisi) : formatMontant(e.saisi)}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Vérifiez la facture avec le fournisseur avant de la saisir à nouveau.
          </p>
        </Encart>
      ) : conforme ? (
        <Encart ton="ok" icone={Check}>
          Facture conforme. À l'enregistrement : commande « Reçue », mouvement « Réception
          fournisseur » et stock {formatNombre(stockActuel)} →{' '}
          {formatNombre(stockActuel + attendu.quantite)}.
        </Encart>
      ) : complet ? (
        <Encart ton="warn" icone={TriangleAlert}>
          Des valeurs diffèrent de la commande : le serveur refusera la facture. Vérifiez la saisie.
        </Encart>
      ) : null}

      <div className="border-line flex flex-wrap justify-end gap-2.5 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => naviguer('/chef/factures-fournisseur')}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={!complet || saisie.isPending}>
          {saisie.isPending ? <Loader2 className="animate-spin" /> : <Check />}
          Enregistrer la facture
        </Button>
      </div>
    </Carte>
  )
}

export default function FactureFournisseurFormulaire() {
  const [parametres, setParametres] = useSearchParams()
  const idCommande = parametres.get('commande') ? Number(parametres.get('commande')) : null
  const commandes = useCommandes()
  const stock = useEtatStock()
  const enAttente = (commandes.data ?? []).filter((c) => c.etat === 'EN_ATTENTE')
  const commande = enAttente.find((c) => c.id_commande === idCommande)
  const stockActuel =
    (stock.data ?? []).find((s) => s.id_produit === commande?.devis?.produit?.id_produit)
      ?.quantite_stock ?? 0

  return (
    <Page>
      <PageEntete
        titre="Saisir une facture fournisseur"
        description="Choisissez la commande livrée, puis recopiez la facture : chaque valeur est comparée à la commande pendant la saisie."
      />
      <Carte>
        <CarteEntete titre="1. Commande livrée" />
        {commandes.isPending ? (
          <SqueletteBloc hauteur={90} className="border-0 p-0" />
        ) : commandes.isError ? (
          <EtatErreur erreur={commandes.error} onReessayer={commandes.refetch} />
        ) : enAttente.length === 0 ? (
          <EtatVide
            icone={PackageCheck}
            titre="Aucune commande à réceptionner"
            message="Toutes les commandes ont déjà été reçues ou annulées."
            action={
              <Button variant="outline" asChild>
                <Link to="/chef/factures-fournisseur">Retour aux factures</Link>
              </Button>
            }
            compact
          />
        ) : (
          <motion.div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" {...listeCascade}>
            {enAttente.map((c) => (
              <CarteCommande
                key={c.id_commande}
                commande={c}
                actif={c.id_commande === idCommande}
                onClick={() =>
                  setParametres({ commande: String(c.id_commande) }, { replace: true })
                }
              />
            ))}
          </motion.div>
        )}
        {idCommande && !commandes.isPending && !commande && (
          <Encart ton="warn">
            La commande {reference('CMD', idCommande)} n'est plus en attente : elle a déjà été reçue
            ou annulée.
          </Encart>
        )}
      </Carte>
      {commande && (
        <Saisie key={commande.id_commande} commande={commande} stockActuel={stockActuel} />
      )}
    </Page>
  )
}
