/*
 * C10ter — Facture imprimable (/chef/factures-client/:id/imprimer).
 * Page A4 sans menu : en-tête NBM, n° et date, client, lignes, total, montant en lettres,
 * mention « Payée comptant ». Bouton « Imprimer » (window.print()) ; styles @media print.
 */
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { lireFactureClient, CANAUX } from '@/api/ventes'
import { ENTREPRISE } from '@/config/entreprise'
import {
  formatDate,
  formatMontant,
  formatNombre,
  formatTelephone,
  montantEnLettres,
  reference,
} from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EtatErreur } from '@/components/commun/Etats'

/** Auteur de la facture d'après le journal (visible si c'est l'utilisateur connecté, RLS oblige) */
async function auteurFacture(numero) {
  const { data } = await supabase
    .from('journal_activite')
    .select('utilisateur(nom, prenom)')
    .eq('action', 'FACTURE_CLIENT')
    .ilike('detail', `%${numero}%`)
    .limit(1)
  return data?.[0]?.utilisateur ?? null
}

export default function FactureImprimable() {
  const { id } = useParams()
  const facture = useQuery({
    queryKey: ['facture-client', Number(id)],
    queryFn: () => lireFactureClient(Number(id)),
  })
  const auteur = useQuery({
    queryKey: ['facture-client', 'auteur', facture.data?.numero],
    queryFn: () => auteurFacture(facture.data.numero),
    enabled: Boolean(facture.data),
  })

  const f = facture.data
  const d = f?.demande_client
  const c = d?.client

  return (
    <div className="bg-bg min-h-svh py-8 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm; } @media print { html, body { background: #fff !important; } }`}</style>
      <div className="mx-auto mb-5 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden">
        <Button variant="outline" asChild>
          <Link to="/chef/factures-client">
            <ArrowLeft /> Retour aux factures
          </Link>
        </Button>
        <Button onClick={() => window.print()} disabled={!f}>
          <Printer /> Imprimer
        </Button>
      </div>

      {/* Feuille A4 : couleurs fixes (toujours claire, même en thème sombre) */}
      <article
        className="shadow-pop mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white px-[16mm] py-[16mm] text-[#111] print:min-h-0 print:max-w-none print:p-0 print:shadow-none"
        aria-label="Facture"
      >
        {facture.isPending ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : facture.isError ? (
          <EtatErreur erreur={facture.error} onReessayer={facture.refetch} />
        ) : (
          <>
            <header className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="inline-flex size-14 items-center justify-center rounded-xl bg-[#14130f] font-serif text-[20px] font-semibold text-[#f4f3ef]">
                  {ENTREPRISE.sigle}
                </span>
                <div>
                  <p className="font-serif text-[22px] leading-tight font-semibold">
                    {ENTREPRISE.nom}
                  </p>
                  <p className="text-[13px] text-[#6a6964]">
                    {[ENTREPRISE.adresse, ENTREPRISE.telephone].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif text-[34px] leading-none font-semibold">Facture</p>
                <p className="mt-3 font-mono text-[14px] font-semibold">{f.numero}</p>
                <p className="mt-1 text-[13px] text-[#6a6964]">
                  Date : {formatDate(f.date_facture)}
                </p>
              </div>
            </header>

            <section className="mt-9 flex flex-wrap justify-between gap-6 rounded-xl bg-[#f3eee2] px-6 py-5 text-[14px] print:[print-color-adjust:exact]">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.1em] text-[#6a6964] uppercase">
                  Client
                </p>
                <p className="mt-1 font-semibold">{c?.nom}</p>
                {c?.adresse && <p>{c.adresse}</p>}
                {c?.telephone && <p>{formatTelephone(c.telephone)}</p>}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold tracking-[0.1em] text-[#6a6964] uppercase">
                  Référence
                </p>
                <p className="mt-1">
                  Demande {reference('DEM', d?.id_demande)} du {formatDate(d?.date_demande)}
                </p>
                <p>Canal : {CANAUX[d?.canal] ?? d?.canal}</p>
              </div>
            </section>

            <table className="mt-8 w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b-2 border-[#111] text-[11px] font-semibold tracking-[0.08em] text-[#6a6964] uppercase">
                  <th className="px-3 pb-2.5 text-left">Désignation</th>
                  <th className="px-3 pb-2.5 text-right">Quantité</th>
                  <th className="px-3 pb-2.5 text-right">Prix unitaire</th>
                  <th className="px-3 pb-2.5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {(d?.ligne_demande ?? []).map((l) => (
                  <tr key={l.id_produit} className="border-b border-[#e5e3dd]">
                    <td className="px-3 py-3">{l.produit?.designation}</td>
                    <td className="tabular px-3 py-3 text-right">{formatNombre(l.quantite)}</td>
                    <td className="tabular px-3 py-3 text-right">
                      {formatMontant(l.prix_unitaire)}
                    </td>
                    <td className="tabular px-3 py-3 text-right font-semibold">
                      {formatMontant(l.quantite * l.prix_unitaire)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 ml-auto w-full max-w-[300px]">
              <div className="flex items-center justify-between rounded-xl bg-[#14130f] px-5 py-4 text-[#f4f3ef] print:[print-color-adjust:exact]">
                <span className="text-[15px]">Total</span>
                <span className="tabular text-[20px] font-semibold">
                  {formatMontant(f.montant_total)}
                </span>
              </div>
              <p className="mt-3 text-right text-[13px] text-[#6a6964]">
                Arrêtée à la somme de {montantEnLettres(f.montant_total).toLowerCase()}.
              </p>
            </div>

            <footer className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[#e5e3dd] pt-5 text-[13px] text-[#6a6964] print:mt-16">
              <div>
                <p>Payée comptant le {formatDate(f.date_facture)}.</p>
                <p>Merci de votre confiance.</p>
              </div>
              {auteur.data && (
                <p>
                  Établie par {auteur.data.prenom} {auteur.data.nom}, chef magasin
                </p>
              )}
            </footer>
          </>
        )}
      </article>
    </div>
  )
}
