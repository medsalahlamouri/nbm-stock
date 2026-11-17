/*
 * B5 — Fiche fournisseur (/gerant/fournisseurs/:id).
 * En-tête (raison sociale, statut, coordonnées, Modifier / Désactiver), évaluation
 * (v_evaluation_fournisseurs), onglets Devis et Commandes.
 */
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, FileText, Mail, MapPin, Pencil, Phone, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { lireFournisseur, listerCommandes, listerDevis, listerEvaluations } from '@/api/achats'
import { formatDate, formatMontant, formatNombre, formatTelephone, reference } from '@/lib/format'
import { etatCommande, statutActif } from '@/lib/etats'
import { useSuppression } from '@/hooks/useSuppression'
import { useFilAriane } from '@/components/layout/FilAriane'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, Tuile } from '@/components/commun/Carte'
import { Badge, BadgeEtat } from '@/components/commun/Badge'
import { DataTable, Reference } from '@/components/commun/DataTable'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { ConfirmDialog } from '@/components/commun/Dialogues'

export default function FournisseurFiche() {
  const { id } = useParams()
  const idF = Number(id)
  const naviguer = useNavigate()
  const [onglet, setOnglet] = useState('devis')
  const [confirmer, setConfirmer] = useState(false)
  const { suppression, reactivation } = useSuppression('fournisseur', { onSupprime: () => naviguer('/gerant/fournisseurs') })

  const fournisseur = useQuery({ queryKey: ['fournisseur', idF], queryFn: () => lireFournisseur(idF) })
  const devis = useQuery({ queryKey: ['devis', { fournisseur: idF }], queryFn: () => listerDevis({ idFournisseur: idF }) })
  const commandes = useQuery({ queryKey: ['commandes'], queryFn: () => listerCommandes() })
  const evaluations = useQuery({ queryKey: ['evaluation'], queryFn: listerEvaluations })
  useFilAriane(fournisseur.data?.raison_sociale)

  if (fournisseur.isError) return <Carte><EtatErreur erreur={fournisseur.error} onReessayer={fournisseur.refetch} /></Carte>
  if (fournisseur.isPending) return <Page><SqueletteBloc hauteur={120} /><SqueletteBloc hauteur={260} /></Page>

  const f = fournisseur.data
  const sesCommandes = (commandes.data ?? []).filter((c) => c.devis?.fournisseur?.id_fournisseur === idF)
  const evaluation = (evaluations.data ?? []).find((e) => e.id_fournisseur === idF)
  const enAttente = sesCommandes.filter((c) => c.etat === 'EN_ATTENTE')
  const enRetard = enAttente.filter((c) => c.jours_restants < 0)
  const matieres = [...new Map((devis.data ?? []).map((d) => [d.produit?.id_produit, d.produit?.designation])).values()].filter(Boolean)
  const jours = (v) => (v === null || v === undefined ? '—' : `${formatNombre(v, 0, 1)} j`)

  const colonnesDevis = [
    { id: 'ref', entete: 'Devis', tri: (d) => d.id_devis, cellule: (d) => <Reference>{reference('DEV', d.id_devis)}</Reference> },
    { id: 'date', entete: 'Date', tri: (d) => d.date_devis, cellule: (d) => formatDate(d.date_devis) },
    { id: 'mp', entete: 'Matière première', tri: (d) => d.produit?.designation, cellule: (d) => d.produit?.designation },
    { id: 'prix', entete: 'Prix unitaire', align: 'right', tri: (d) => d.prix_unitaire, cellule: (d) => formatMontant(d.prix_unitaire) },
    { id: 'delai', entete: 'Délai', align: 'right', tri: (d) => d.delai_livraison, cellule: (d) => `${d.delai_livraison} j` },
    {
      id: 'utilisation',
      entete: 'Utilisation',
      cellule: (d) => (d.utilise ? <Badge ton="neutral">Utilisé · verrouillé</Badge> : <Badge ton="ok">Disponible</Badge>),
    },
  ]
  const colonnesCommandes = [
    { id: 'ref', entete: 'Commande', tri: (c) => c.id_commande, cellule: (c) => <Reference className="underline underline-offset-2">{reference('CMD', c.id_commande)}</Reference> },
    { id: 'date', entete: 'Date', tri: (c) => c.date_commande, cellule: (c) => formatDate(c.date_commande) },
    { id: 'mp', entete: 'Matière première', cellule: (c) => c.devis?.produit?.designation },
    { id: 'qte', entete: 'Quantité', align: 'right', tri: (c) => c.quantite, cellule: (c) => formatNombre(c.quantite) },
    { id: 'montant', entete: 'Montant', align: 'right', tri: (c) => c.montant, cellule: (c) => formatMontant(c.montant) },
    { id: 'etat', entete: 'État', cellule: (c) => <BadgeEtat etat={etatCommande(c)} /> },
  ]

  return (
    <Page>
      <PageEntete
        titre={f.raison_sociale}
        description={
          <>
            <span className="font-mono">{reference('FRN', f.id_fournisseur)}</span>
            {f.adresse && ` · ${f.adresse}`}
          </>
        }
        badges={<BadgeEtat etat={statutActif(f.actif)} />}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/gerant/fournisseurs/${idF}/modifier`}>
                <Pencil /> Modifier
              </Link>
            </Button>
            {f.actif ? (
              <>
                <Button variant="danger" onClick={() => setConfirmer(true)}>
                  <Trash2 /> Désactiver
                </Button>
                <Button asChild>
                  <Link to={`/gerant/devis/nouveau?fournisseur=${idF}`}>
                    <Plus /> Nouveau devis
                  </Link>
                </Button>
              </>
            ) : (
              <Button onClick={() => reactivation.mutate(idF)} disabled={reactivation.isPending}>
                <RotateCcw /> Réactiver
              </Button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(300px,1fr)_2fr]">
        <Carte>
          <CarteEntete titre="Coordonnées" />
          <ul className="flex flex-col gap-3 text-[14px]">
            <li className="flex items-center gap-3">
              <Phone className="size-4 text-mutedtxt" aria-hidden="true" />
              {f.telephone ? <a href={`tel:${f.telephone}`} className="tabular hover:underline">{formatTelephone(f.telephone)}</a> : <span className="text-muted2">Non renseigné</span>}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-mutedtxt" aria-hidden="true" />
              {f.email ? <a href={`mailto:${f.email}`} className="truncate underline underline-offset-2">{f.email}</a> : <span className="text-muted2">Non renseigné</span>}
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-mutedtxt" aria-hidden="true" />
              {f.adresse || <span className="text-muted2">Non renseignée</span>}
            </li>
          </ul>
          <div className="border-t border-line pt-4">
            <p className="text-[14px] font-semibold text-ink">Matières proposées</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {matieres.length ? matieres.map((m) => <Badge key={m}>{m}</Badge>) : <span className="text-[13px] text-mutedtxt">Aucun devis enregistré.</span>}
            </div>
          </div>
        </Carte>

        <Carte>
          <CarteEntete
            titre="Évaluation"
            description="Délai réel = date de la facture − date de la commande"
            action={enRetard.length > 0 && <Badge ton="danger">{enRetard.length} commande(s) en retard</Badge>}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <Tuile libelle="Reçues" valeur={formatNombre(evaluation?.commandes_recues ?? 0)} />
            <Tuile libelle="En attente" valeur={formatNombre(enAttente.length)} />
            <Tuile libelle="Délai annoncé" valeur={jours(evaluation?.delai_annonce_moyen)} />
            <Tuile libelle="Délai réel" valeur={jours(evaluation?.delai_reel_moyen)} />
            <Tuile libelle="Retard moyen" valeur={jours(evaluation?.retard_moyen)} ton={evaluation?.retard_moyen > 0 ? 'danger' : undefined} />
          </div>
          {!evaluation?.commandes_recues && (
            <p className="text-[13px] text-mutedtxt">
              Aucune commande reçue pour l'instant : le délai réel sera calculé à la saisie de la facture
              {enAttente[0] ? ` de la commande ${reference('CMD', enAttente[0].id_commande)}` : ' de la première commande'}.
            </p>
          )}
        </Carte>
      </div>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-[22px] pb-4">
          <Onglets
            valeur={onglet}
            onChange={setOnglet}
            libelle="Historique"
            options={[
              { valeur: 'devis', libelle: 'Devis', compteur: devis.data?.length ?? 0, icone: FileText },
              { valeur: 'commandes', libelle: 'Commandes', compteur: sesCommandes.length, icone: ClipboardList },
            ]}
          />
          <Button variant="outline" size="sm" asChild>
            <Link to={onglet === 'devis' ? '/gerant/devis' : '/gerant/commandes'}>{onglet === 'devis' ? 'Tous les devis' : 'Toutes les commandes'}</Link>
          </Button>
        </div>
        {onglet === 'devis' ? (
          <DataTable
            colonnes={colonnesDevis}
            lignes={devis.data}
            cle={(d) => d.id_devis}
            chargement={devis.isPending}
            erreur={devis.error}
            onReessayer={devis.refetch}
            onLigneClick={(d) => naviguer(`/gerant/devis/${d.id_devis}/modifier`)}
            libelleElements="devis"
            vide={<EtatVide icone={FileText} titre="Aucun devis" message="Ce fournisseur n'a encore transmis aucun devis." compact />}
          />
        ) : (
          <DataTable
            colonnes={colonnesCommandes}
            lignes={sesCommandes}
            cle={(c) => c.id_commande}
            chargement={commandes.isPending}
            erreur={commandes.error}
            onReessayer={commandes.refetch}
            onLigneClick={(c) => naviguer(`/gerant/commandes/${c.id_commande}`)}
            libelleElements="commande(s)"
            vide={<EtatVide icone={ClipboardList} titre="Aucune commande" message="Aucune commande n'a été passée à ce fournisseur." compact />}
          />
        )}
      </Carte>

      <ConfirmDialog
        ouvert={confirmer}
        onOuvertChange={setConfirmer}
        titre={`Supprimer ou désactiver « ${f.raison_sociale} » ?`}
        message="S'il a des devis ou des commandes, le fournisseur sera seulement désactivé : son historique est conservé."
        libelleConfirmer="Confirmer"
        onConfirmer={() => suppression.mutateAsync(idF)}
      />
    </Page>
  )
}
