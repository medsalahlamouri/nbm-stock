/*
 * B14 — Sauvegarde des données (/gerant/sauvegarde).
 * Explication (contenu, conservation hors de la plateforme, restauration hors application),
 * bouton « Télécharger la sauvegarde » → Edge Function sauvegarder-donnees → fichier JSON
 * sauvegarde-nbm-AAAA-MM-JJ-HH-MM-SS.json ; dernière sauvegarde (dernière action SAUVEGARDE du journal).
 */
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Check,
  Database,
  Download,
  HardDrive,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { derniereSauvegarde, telechargerSauvegarde } from '@/api/journal'
import { formatDateHeure, formatNombre } from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, LigneInfo } from '@/components/commun/Carte'
import { Encart } from '@/components/commun/Encart'
import { Skeleton } from '@/components/ui/skeleton'

const TABLES = [
  ['utilisateur', 'Comptes'],
  ['produit', 'Produits'],
  ['mouvement_stock', 'Mouvements de stock'],
  ['fournisseur', 'Fournisseurs'],
  ['devis', 'Devis'],
  ['commande_fournisseur', 'Commandes fournisseur'],
  ['facture_fournisseur', 'Factures fournisseur'],
  ['client', 'Clients'],
  ['demande_client', 'Demandes client'],
  ['ligne_demande', 'Lignes de demande'],
  ['facture_client', 'Factures client'],
  ['journal_activite', "Journal d'activité"],
]

export default function Sauvegarde() {
  const [resultat, setResultat] = useState(null)
  const derniere = useQuery({ queryKey: ['journal', 'sauvegarde'], queryFn: derniereSauvegarde })
  const sauvegarde = useMutation({
    mutationFn: telechargerSauvegarde,
    onSuccess: async (r) => {
      setResultat(r)
      await invalider('journal')
      toast.success('Sauvegarde téléchargée.', { description: r.nom })
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  return (
    <Page>
      <PageEntete
        titre="Sauvegarde des données"
        description="Téléchargez une copie complète des données de NBM Stock au format JSON."
      />
      <div className="grid items-start gap-[18px] lg:grid-cols-[2fr_minmax(300px,1fr)]">
        <Carte>
          <CarteEntete
            titre="Télécharger la sauvegarde"
            description="Toutes les tables de l'application, telles qu'elles sont au moment du téléchargement."
            icone={<Database className="text-gold2 mt-0.5 size-5" aria-hidden="true" />}
          />
          <ul className="grid gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-2">
            {TABLES.map(([cle, libelle]) => (
              <li
                key={cle}
                className="border-line3 flex items-center justify-between gap-2 border-b py-1.5"
              >
                <span className="text-ink2 flex items-center gap-2">
                  <Check className="text-okfg size-3.5" aria-hidden="true" /> {libelle}
                </span>
                {resultat?.tables?.[cle] !== undefined && (
                  <span className="text-mutedtxt tabular text-[13px]">
                    {formatNombre(resultat.tables[cle])} ligne(s)
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" onClick={() => sauvegarde.mutate()} disabled={sauvegarde.isPending}>
              {sauvegarde.isPending ? <Loader2 className="animate-spin" /> : <Download />}
              {sauvegarde.isPending ? 'Préparation…' : 'Télécharger la sauvegarde'}
            </Button>
            {resultat && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-okfg text-[13px]"
              >
                {resultat.nom}
              </motion.span>
            )}
          </div>
        </Carte>

        <div className="flex flex-col gap-[18px]">
          <Carte>
            <CarteEntete titre="Dernière sauvegarde" />
            {derniere.isPending ? (
              <Skeleton className="h-12" />
            ) : derniere.data ? (
              <dl>
                <LigneInfo libelle="Date" fort>
                  {formatDateHeure(derniere.data.date_heure)}
                </LigneInfo>
                <LigneInfo libelle="Par">
                  {derniere.data.utilisateur
                    ? `${derniere.data.utilisateur.prenom} ${derniere.data.utilisateur.nom}`
                    : '—'}
                </LigneInfo>
              </dl>
            ) : (
              <Encart ton="warn" icone={TriangleAlert}>
                Aucune sauvegarde enregistrée pour l'instant.
              </Encart>
            )}
          </Carte>
          <Carte>
            <CarteEntete titre="Bonnes pratiques" />
            <ul className="text-ink3 flex flex-col gap-3 text-[14px]">
              <li className="flex gap-2.5">
                <HardDrive className="text-mutedtxt mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Conservez le fichier hors de la plateforme (clé USB, disque externe), au moins une
                fois par semaine.
              </li>
              <li className="flex gap-2.5">
                <ShieldCheck className="text-mutedtxt mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Le fichier contient des données personnelles et commerciales : gardez-le en lieu
                sûr.
              </li>
              <li className="flex gap-2.5">
                <Database className="text-mutedtxt mt-0.5 size-4 shrink-0" aria-hidden="true" />
                La restauration se fait hors de l'application, par l'administrateur de la base de
                données.
              </li>
            </ul>
          </Carte>
        </div>
      </div>
    </Page>
  )
}
