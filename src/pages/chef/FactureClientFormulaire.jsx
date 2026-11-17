/*
 * C10bis — Établir une facture (/chef/factures-client/nouvelle?demande=id).
 * Récapitulatif : client, lignes, stock disponible par ligne (✓ / ✗), total.
 * rpc('etablir_facture_client') :
 *  - ok: true  → toast avec le numéro, alertes de seuil éventuelles, bouton « Imprimer » ;
 *  - ok: false → encart des articles manquants (demandé / disponible) : la demande reste en attente.
 * Mention : paiement comptant, facture réputée payée.
 */
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, CircleCheck, CircleX, FileText, Loader2, Printer, Receipt, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { CANAUX, etablirFactureClient, lireDemande } from '@/api/ventes'
import { useDemandes } from '@/hooks/useDonnees'
import { formatDate, formatMontant, formatNombre, formatTelephone, reference } from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, LigneInfo } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { Encart } from '@/components/commun/Encart'
import { Combobox } from '@/components/commun/Combobox'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'

function Recapitulatif({ demande }) {
  const naviguer = useNavigate()
  const [resultat, setResultat] = useState(null)
  const manquantsParId = Object.fromEntries((resultat?.ok === false ? resultat.manquants : []).map((m) => [m.id_produit, m]))
  const tousDisponibles = demande.lignes.every((l) => l.quantite <= (l.produit?.quantite_stock ?? 0))

  const facture = useMutation({
    mutationFn: () => etablirFactureClient(demande.id_demande),
    onSuccess: async (r) => {
      setResultat(r)
      if (r?.ok === false) return // pas une erreur : articles manquants affichés dans l'écran
      await invalider('ventes', 'stock')
      toast.success(`Facture ${r.numero} établie : ${formatMontant(r.montant_total)}.`, {
        action: { label: 'Imprimer', onClick: () => naviguer(`/chef/factures-client/${r.id_facture}/imprimer`) },
      })
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  if (resultat?.ok) {
    return (
      <Carte>
        <EtatVide
          icone={CircleCheck}
          titre={`Facture ${resultat.numero} établie`}
          message={`${demande.client?.nom} · ${formatMontant(resultat.montant_total)} · payée comptant. Le stock des articles a été mis à jour (mouvements « Vente »).`}
          action={
            <>
              <Button asChild>
                <Link to={`/chef/factures-client/${resultat.id_facture}/imprimer`}>
                  <Printer /> Imprimer la facture
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/chef/factures-client">Retour aux factures</Link>
              </Button>
            </>
          }
        />
        {resultat.alertes?.length > 0 && (
          <Encart ton="warn" icone={TriangleAlert} titre="Seuils minimums atteints après cette vente">
            <ul className="mt-1 flex flex-col gap-0.5">
              {resultat.alertes.map((a) => (
                <li key={a.id_produit}>
                  {a.designation} : stock {formatNombre(a.stock)} (seuil {formatNombre(a.seuil)}) — pensez à lancer une production.
                </li>
              ))}
            </ul>
          </Encart>
        )}
      </Carte>
    )
  }

  return (
    <div className="grid items-start gap-[18px] lg:grid-cols-[2fr_minmax(280px,1fr)]">
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="p-[22px] pb-4">
          <CarteEntete titre="Articles demandés" description="Le stock disponible est vérifié par le serveur au moment de l'établissement." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="border-y border-line bg-surf2 text-[12px] font-semibold tracking-[0.04em] text-mutedtxt uppercase">
              <tr>
                <th className="h-[42px] px-3 pl-[22px] text-left">Article</th>
                <th className="px-3 text-right">Quantité</th>
                <th className="px-3 text-right">Prix unitaire</th>
                <th className="px-3 text-right">Montant</th>
                <th className="px-3 pr-[22px] text-left">Stock disponible</th>
              </tr>
            </thead>
            <tbody>
              {demande.lignes.map((l) => {
                const manquant = manquantsParId[l.id_produit]
                const dispo = manquant ? manquant.disponible : l.produit?.quantite_stock
                const ok = !manquant && l.quantite <= dispo
                return (
                  <tr key={l.id_produit} className="border-b border-line3">
                    <td className="h-[52px] px-3 pl-[22px]">
                      <div className="font-semibold text-ink">{l.produit?.designation}</div>
                      <div className="text-[12px] text-mutedtxt">{l.produit?.code}</div>
                    </td>
                    <td className="px-3 text-right tabular">{formatNombre(l.quantite)}</td>
                    <td className="px-3 text-right tabular">{formatMontant(l.prix_unitaire)}</td>
                    <td className="px-3 text-right font-semibold tabular">{formatMontant(l.quantite * l.prix_unitaire)}</td>
                    <td className="px-3 pr-[22px]">
                      <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${ok ? 'text-okfg' : 'text-dfg'}`}>
                        {ok ? <CircleCheck className="size-4" aria-hidden="true" /> : <CircleX className="size-4" aria-hidden="true" />}
                        {formatNombre(dispo)} {l.produit?.unite}
                        <span className="sr-only">{ok ? ' : suffisant' : ' : insuffisant'}</span>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-3 px-[22px] py-4">
          <span className="text-[14px] text-mutedtxt">Total</span>
          <span className="font-serif text-[26px] font-semibold text-strong tabular">{formatMontant(demande.montant)}</span>
        </div>
      </Carte>

      <div className="flex flex-col gap-[18px]">
        <Carte>
          <CarteEntete titre="Client" />
          <dl>
            <LigneInfo libelle="Nom" fort>
              {demande.client?.nom}
            </LigneInfo>
            <LigneInfo libelle="Téléphone">{formatTelephone(demande.client?.telephone)}</LigneInfo>
            <LigneInfo libelle="Demande">
              <span className="font-mono">{reference('DEM', demande.id_demande)}</span> du {formatDate(demande.date_demande)}
            </LigneInfo>
            <LigneInfo libelle="Canal">{CANAUX[demande.canal]}</LigneInfo>
          </dl>
        </Carte>
        {resultat?.ok === false && (
          <Encart ton="danger" icone={TriangleAlert} titre="Stock insuffisant : la facture n'a pas été établie">
            <ul className="mt-1 flex flex-col gap-0.5">
              {resultat.manquants.map((m) => (
                <li key={m.id_produit}>
                  {m.designation} : demandé {formatNombre(m.demande)}, disponible {formatNombre(m.disponible)}
                </li>
              ))}
            </ul>
            <p className="mt-2">La demande reste en attente. Produisez les articles manquants ou modifiez la demande.</p>
          </Encart>
        )}
        {!tousDisponibles && !resultat && (
          <Encart ton="warn" icone={TriangleAlert}>
            Certains articles semblent insuffisants en stock : le serveur refusera probablement la facture.
          </Encart>
        )}
        <Encart ton="neutral">Paiement comptant : la facture est réputée payée dès son établissement.</Encart>
        <div className="flex flex-wrap gap-2.5">
          <Button size="lg" className="flex-1" onClick={() => facture.mutate()} disabled={facture.isPending}>
            {facture.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            Établir la facture
          </Button>
          {resultat?.ok === false && (
            <Button size="lg" variant="outline" asChild>
              <Link to={`/chef/demandes/${demande.id_demande}/modifier`}>Modifier la demande</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FactureClientFormulaire() {
  const [parametres, setParametres] = useSearchParams()
  const idDemande = parametres.get('demande') ? Number(parametres.get('demande')) : null
  const demandes = useDemandes()
  const demande = useQuery({ queryKey: ['demande', idDemande], queryFn: () => lireDemande(idDemande), enabled: Boolean(idDemande) })
  const options = (demandes.data ?? [])
    .filter((d) => d.etat === 'EN_ATTENTE')
    .map((d) => ({ valeur: d.id_demande, libelle: `${reference('DEM', d.id_demande)} · ${d.client?.nom}`, sousLibelle: formatDate(d.date_demande), droite: formatMontant(d.montant) }))

  return (
    <Page>
      <PageEntete titre="Établir une facture" description="Vérifiez le stock des articles demandés, puis établissez la facture. Le stock est mis à jour automatiquement." />
      <Carte>
        <div className="max-w-[560px]">
          <Combobox
            libelle="Demande à facturer"
            valeur={idDemande}
            onChange={(v) => setParametres(v ? { demande: String(v) } : {}, { replace: true })}
            options={options}
            placeholder="Choisir une demande en attente"
            recherchePlaceholder="DEM-… ou client…"
          />
        </div>
      </Carte>
      {!idDemande ? (
        <Carte>
          <EtatVide icone={FileText} titre="Choisissez une demande en attente" message="Son récapitulatif et le stock disponible de chaque article s'afficheront ici." />
        </Carte>
      ) : demande.isPending ? (
        <SqueletteBloc hauteur={220} />
      ) : demande.isError ? (
        <Carte>
          <EtatErreur erreur={demande.error} onReessayer={demande.refetch} />
        </Carte>
      ) : demande.data.etat !== 'EN_ATTENTE' ? (
        <Carte>
          <Encart ton="info" icone={Receipt} titre={`Demande ${demande.data.etat === 'FACTUREE' ? 'déjà facturée' : 'annulée'}`}>
            {demande.data.facture ? (
              <>
                Facture {demande.data.facture.numero} du {formatDate(demande.data.facture.date_facture)}.{' '}
                <Link to={`/chef/factures-client/${demande.data.facture.id_facture_c}/imprimer`} className="font-semibold underline underline-offset-2">
                  Voir la facture
                </Link>
              </>
            ) : (
              'Cette demande ne peut plus être facturée.'
            )}
          </Encart>
          <div>
            <Badge>{reference('DEM', demande.data.id_demande)}</Badge>
          </div>
        </Carte>
      ) : (
        <Recapitulatif key={demande.data.id_demande} demande={demande.data} />
      )}
    </Page>
  )
}
