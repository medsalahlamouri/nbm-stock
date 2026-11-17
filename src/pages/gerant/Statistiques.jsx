/*
 * B11 — Statistiques (/gerant/statistiques).
 * Période (onglets 3 / 6 / 12 mois). Sections : ventes par mois (barres), consommations par MP,
 * valeur du stock (MP / articles), analyse ABC (v_analyse_abc : tableau + répartition A/B/C),
 * évaluation des fournisseurs (v_evaluation_fournisseurs), meilleurs articles vendus.
 * Boutons « Exporter en PDF » et « Exporter en Excel » (titre, date, période, contenu de la page).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Armchair, FileDown, FileSpreadsheet, Layers, Loader2, Receipt, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { deballer } from '@/lib/erreurs'
import { toutLire } from '@/lib/requetes'
import { listerFacturesClient } from '@/api/ventes'
import { useEtatStock, useEvaluations, usePrixAchat } from '@/hooks/useDonnees'
import { dateISO, formatDate, formatDateLongue, formatMilliers, formatMoisCourt, formatMontant, formatMontantArrondi, formatNombre } from '@/lib/format'
import { CLASSES_ABC } from '@/lib/etats'
import { exporterExcel, exporterPdf } from '@/lib/exports'
import { messageErreur } from '@/lib/erreurs'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte, CarteEntete, GrilleBlocs, GrilleIndicateurs, Tuile } from '@/components/commun/Carte'
import { StatCard } from '@/components/commun/StatCard'
import { Badge, BadgeEtat } from '@/components/commun/Badge'
import { DataTable } from '@/components/commun/DataTable'
import { EtatErreur, EtatVide, SqueletteBloc } from '@/components/commun/Etats'
import { Onglets } from '@/components/commun/Onglets'
import { BarresHorizontales, Histogramme } from '@/components/commun/Graphiques'

const PERIODES = [
  { valeur: 3, libelle: '3 mois' },
  { valeur: 6, libelle: '6 mois' },
  { valeur: 12, libelle: '12 mois' },
]

function debutMois(nbMois) {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() - nbMois + 1)
  return d
}

async function lireConsommations(depuis) {
  return toutLire(() =>
    supabase
      .from('mouvement_stock')
      .select('quantite, produit(id_produit, code, designation, unite)')
      .eq('motif', 'Consommation atelier')
      .gte('date_mouvement', depuis)
      .order('id_mouvement'),
  )
}

export default function Statistiques() {
  const [nbMois, setNbMois] = useState(6)
  const [export_, setExport] = useState(null)
  const depuis = debutMois(nbMois)
  const depuisISO = dateISO(depuis)

  const factures = useQuery({ queryKey: ['statistiques', 'factures', nbMois], queryFn: () => listerFacturesClient({ depuis: depuisISO }) })
  const consommations = useQuery({ queryKey: ['statistiques', 'consommations', nbMois], queryFn: () => lireConsommations(depuis.toISOString()) })
  const abc = useQuery({ queryKey: ['abc'], queryFn: async () => deballer(await supabase.from('v_analyse_abc').select('*').order('rang')) })
  const evaluations = useEvaluations()
  const stock = useEtatStock()
  const prix = usePrixAchat()

  const ventes = useMemo(() => {
    const mois = []
    for (let i = 0; i < nbMois; i += 1) {
      const d = new Date(depuis)
      d.setMonth(depuis.getMonth() + i)
      mois.push({ cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, mois: formatMoisCourt(d), date: d, montant: 0, nombre: 0 })
    }
    const parCle = Object.fromEntries(mois.map((m) => [m.cle, m]))
    const articles = {}
    for (const f of factures.data ?? []) {
      const m = parCle[f.date_facture.slice(0, 7)]
      if (m) {
        m.montant += Number(f.montant_total)
        m.nombre += 1
      }
      for (const l of f.demande_client?.ligne_demande ?? []) {
        const a = (articles[l.id_produit] ??= { designation: l.produit?.designation, code: l.produit?.code, quantite: 0, montant: 0 })
        a.quantite += l.quantite
        a.montant += l.quantite * Number(l.prix_unitaire)
      }
    }
    return {
      mois,
      total: mois.reduce((t, m) => t + m.montant, 0),
      nombre: mois.reduce((t, m) => t + m.nombre, 0),
      articles: Object.values(articles).sort((a, b) => b.montant - a.montant).slice(0, 8),
    }
    // depuis est recalculé à partir de nbMois
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [factures.data, nbMois])

  const conso = useMemo(() => {
    const parMP = {}
    for (const m of consommations.data ?? []) {
      const p = (parMP[m.produit?.id_produit] ??= { designation: m.produit?.designation, unite: m.produit?.unite, quantite: 0, valeur: 0, id: m.produit?.id_produit })
      p.quantite += m.quantite
    }
    for (const p of Object.values(parMP)) p.valeur = p.quantite * (prix.data?.[p.id] ?? 0)
    return Object.values(parMP).sort((a, b) => b.valeur - a.valeur || b.quantite - a.quantite)
  }, [consommations.data, prix.data])

  const valeurs = useMemo(() => {
    const actifs = (stock.data ?? []).filter((p) => p.actif)
    return {
      mp: actifs.filter((p) => p.type === 'MP').reduce((t, p) => t + p.quantite_stock * (prix.data?.[p.id_produit] ?? 0), 0),
      articles: actifs.filter((p) => p.type === 'ARTICLE').reduce((t, p) => t + Number(p.valeur_stock ?? 0), 0),
    }
  }, [stock.data, prix.data])

  const repartitionABC = useMemo(() => {
    const r = { A: { nombre: 0, valeur: 0 }, B: { nombre: 0, valeur: 0 }, C: { nombre: 0, valeur: 0 } }
    const total = (abc.data ?? []).reduce((t, l) => t + Number(l.valeur ?? 0), 0)
    for (const l of abc.data ?? []) {
      r[l.classe].nombre += 1
      r[l.classe].valeur += Number(l.valeur ?? 0)
    }
    return { r, total }
  }, [abc.data])

  const libellePeriode = `du ${formatDate(depuis)} au ${formatDate(new Date())}`

  const contenuExport = () => ({
    titre: 'NBM Stock — Statistiques',
    sousTitre: `Édité le ${formatDateLongue(new Date())} · période de ${nbMois} mois ${libellePeriode}`,
    sections: [
      { titre: 'Ventes par mois', colonnes: ['Mois', 'Factures', 'Montant (DT)'], lignes: ventes.mois.map((m) => [m.mois + ' ' + m.date.getFullYear(), m.nombre, formatMontant(m.montant, false)]) },
      { titre: 'Consommations par matière première', colonnes: ['Matière première', 'Quantité', 'Unité', 'Valeur estimée (DT)'], lignes: conso.map((c) => [c.designation, c.quantite, c.unite, formatMontant(c.valeur, false)]) },
      { titre: 'Valeur du stock', colonnes: ['Catégorie', 'Valeur (DT)'], lignes: [['Matières premières (dernier prix d’achat)', formatMontant(valeurs.mp, false)], ['Articles (prix de vente)', formatMontant(valeurs.articles, false)]] },
      {
        titre: 'Analyse ABC',
        colonnes: ['Rang', 'Code', 'Matière première', 'Quantité consommée', 'Dernier prix', 'Valeur', '%', '% cumulé', 'Classe'],
        lignes: (abc.data ?? []).map((l) => [l.rang, l.code, l.designation, l.quantite_consommee, formatMontant(l.dernier_prix, false), formatMontant(l.valeur, false), formatNombre(l.pourcentage, 2), formatNombre(l.pourcentage_cumule, 2), l.classe]),
      },
      {
        titre: 'Évaluation des fournisseurs',
        colonnes: ['Fournisseur', 'Commandes reçues', 'Délai annoncé (j)', 'Délai réel (j)', 'Retard moyen (j)'],
        lignes: (evaluations.data ?? []).map((e) => [e.raison_sociale, e.commandes_recues, formatNombre(e.delai_annonce_moyen, 0, 1), formatNombre(e.delai_reel_moyen, 0, 1), formatNombre(e.retard_moyen, 0, 1)]),
      },
      { titre: 'Meilleurs articles vendus', colonnes: ['Article', 'Quantité', 'Chiffre d’affaires (DT)'], lignes: ventes.articles.map((a) => [a.designation, a.quantite, formatMontant(a.montant, false)]) },
    ],
  })

  const exporter = async (format) => {
    setExport(format)
    try {
      if (format === 'pdf') await exporterPdf(contenuExport())
      else await exporterExcel(contenuExport())
      toast.success(`Statistiques exportées en ${format === 'pdf' ? 'PDF' : 'Excel'}.`)
    } catch (e) {
      toast.error(messageErreur(e, "L'export a échoué."))
    } finally {
      setExport(null)
    }
  }
  const pret = !factures.isPending && !consommations.isPending && !abc.isPending && !evaluations.isPending

  const colonnesABC = [
    { id: 'rang', entete: 'Rang', align: 'right', tri: (l) => l.rang, cellule: (l) => l.rang, largeur: 70 },
    { id: 'mp', entete: 'Matière première', tri: (l) => l.designation, cellule: (l) => <span className="font-semibold">{l.designation}</span> },
    { id: 'qte', entete: 'Consommée', align: 'right', tri: (l) => l.quantite_consommee, cellule: (l) => formatNombre(l.quantite_consommee) },
    { id: 'valeur', entete: 'Valeur', align: 'right', tri: (l) => Number(l.valeur), cellule: (l) => formatMontantArrondi(l.valeur) },
    { id: 'pct', entete: '%', align: 'right', tri: (l) => Number(l.pourcentage), cellule: (l) => `${formatNombre(l.pourcentage, 1)} %` },
    { id: 'cumul', entete: '% cumulé', align: 'right', tri: (l) => Number(l.pourcentage_cumule), cellule: (l) => `${formatNombre(l.pourcentage_cumule, 1)} %` },
    { id: 'classe', entete: 'Classe', cellule: (l) => <BadgeEtat etat={CLASSES_ABC[l.classe]} /> },
  ]
  const colonnesFournisseurs = [
    { id: 'f', entete: 'Fournisseur', tri: (e) => e.raison_sociale, cellule: (e) => <span className="font-semibold">{e.raison_sociale}</span> },
    { id: 'recues', entete: 'Reçues', align: 'right', tri: (e) => e.commandes_recues, cellule: (e) => formatNombre(e.commandes_recues) },
    { id: 'annonce', entete: 'Délai annoncé', align: 'right', tri: (e) => e.delai_annonce_moyen, cellule: (e) => (e.delai_annonce_moyen === null ? '—' : `${formatNombre(e.delai_annonce_moyen, 0, 1)} j`) },
    { id: 'reel', entete: 'Délai réel', align: 'right', tri: (e) => e.delai_reel_moyen, cellule: (e) => (e.delai_reel_moyen === null ? '—' : `${formatNombre(e.delai_reel_moyen, 0, 1)} j`) },
    {
      id: 'retard',
      entete: 'Retard moyen',
      align: 'right',
      tri: (e) => e.retard_moyen,
      cellule: (e) =>
        e.retard_moyen === null ? '—' : <Badge ton={e.retard_moyen > 0 ? 'danger' : 'ok'}>{e.retard_moyen > 0 ? `+${formatNombre(e.retard_moyen, 0, 1)} j` : 'À l’heure'}</Badge>,
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Statistiques"
        description={`Ventes, consommations, valeur du stock, analyse ABC et évaluation des fournisseurs · ${libellePeriode}.`}
        actions={
          <>
            <Onglets options={PERIODES} valeur={nbMois} onChange={setNbMois} libelle="Période" taille="sm" />
            <Button variant="outline" onClick={() => exporter('pdf')} disabled={!pret || export_ !== null}>
              {export_ === 'pdf' ? <Loader2 className="animate-spin" /> : <FileDown />} Exporter en PDF
            </Button>
            <Button variant="outline" onClick={() => exporter('excel')} disabled={!pret || export_ !== null}>
              {export_ === 'excel' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} Exporter en Excel
            </Button>
          </>
        }
      />

      <GrilleIndicateurs>
        <StatCard libelle="Chiffre d'affaires" valeur={ventes.total} formater={formatMontantArrondi} sousTexte={`${formatNombre(ventes.nombre)} facture(s) sur ${nbMois} mois`} icone={Receipt} ton="ok" chargement={factures.isPending} />
        <StatCard libelle="Panier moyen" valeur={ventes.nombre ? ventes.total / ventes.nombre : 0} formater={formatMontantArrondi} sousTexte="par facture" icone={Wallet} chargement={factures.isPending} />
        <StatCard libelle="Valeur du stock MP" valeur={valeurs.mp} formater={formatMontantArrondi} sousTexte="au dernier prix d'achat" icone={Layers} ton="info" chargement={stock.isPending || prix.isPending} />
        <StatCard libelle="Valeur du stock articles" valeur={valeurs.articles} formater={formatMontantArrondi} sousTexte="au prix de vente" icone={Armchair} ton="warn" chargement={stock.isPending} />
      </GrilleIndicateurs>

      <GrilleBlocs>
        <Carte>
          <CarteEntete titre="Ventes par mois" description="Montant facturé, en milliers de dinars (k = 1 000 DT) · mois en cours en doré" />
          {factures.isPending ? (
            <SqueletteBloc hauteur={240} className="border-0 p-0" />
          ) : factures.isError ? (
            <EtatErreur erreur={factures.error} onReessayer={factures.refetch} />
          ) : (
            <Histogramme donnees={ventes.mois} cleX="mois" cleY="montant" formaterAxe={formatMilliers} formaterValeur={formatMontant} libelleSerie="Ventes" miseEnAvant={(d) => d === ventes.mois.at(-1)} />
          )}
        </Carte>
        <Carte>
          <CarteEntete titre="Consommations par matière première" description="Valeur estimée au dernier prix d'achat, sur la période" />
          {consommations.isPending ? (
            <SqueletteBloc hauteur={240} className="border-0 p-0" />
          ) : consommations.isError ? (
            <EtatErreur erreur={consommations.error} onReessayer={consommations.refetch} />
          ) : conso.length === 0 ? (
            <EtatVide titre="Aucune consommation" message="Aucune sortie « Consommation atelier » sur la période." compact />
          ) : (
            <BarresHorizontales donnees={conso.slice(0, 8)} cleLibelle="designation" cleValeur="valeur" formaterValeur={formatMontantArrondi} libelleSerie="Valeur consommée" />
          )}
        </Carte>
      </GrilleBlocs>

      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="flex flex-col gap-4 p-[22px] pb-4">
          <CarteEntete titre="Analyse ABC des matières premières" description="Classement par valeur consommée : A ≈ 80 % de la valeur, B ≈ 15 %, C ≈ 5 %. Les matières A sont à surveiller en priorité." />
          <div className="grid grid-cols-3 gap-3">
            {['A', 'B', 'C'].map((c) => (
              <Tuile
                key={c}
                libelle={`${CLASSES_ABC[c].libelle} · ${formatNombre(repartitionABC.r[c].nombre)} matière(s)`}
                valeur={repartitionABC.total ? `${formatNombre((repartitionABC.r[c].valeur / repartitionABC.total) * 100, 0)} %` : '—'}
                ton={CLASSES_ABC[c].ton}
              />
            ))}
          </div>
        </div>
        <DataTable
          colonnes={colonnesABC}
          lignes={abc.data}
          cle={(l) => l.id_produit}
          chargement={abc.isPending}
          erreur={abc.error}
          onReessayer={abc.refetch}
          libelleElements="matière(s)"
          vide={<EtatVide titre="Analyse indisponible" message="Aucune consommation enregistrée pour classer les matières." compact />}
        />
      </Carte>

      <GrilleBlocs>
        <Carte sansPadding className="gap-0 overflow-hidden">
          <div className="p-[22px] pb-4">
            <CarteEntete titre="Évaluation des fournisseurs" description="Délai réel = date de la facture − date de la commande" />
          </div>
          <DataTable
            colonnes={colonnesFournisseurs}
            lignes={evaluations.data}
            cle={(e) => e.id_fournisseur}
            chargement={evaluations.isPending}
            erreur={evaluations.error}
            onReessayer={evaluations.refetch}
            libelleElements="fournisseur(s)"
            vide={<EtatVide titre="Aucun fournisseur" compact />}
          />
        </Carte>
        <Carte>
          <CarteEntete titre="Meilleurs articles vendus" description="Chiffre d'affaires facturé sur la période" />
          {factures.isPending ? (
            <SqueletteBloc hauteur={240} className="border-0 p-0" />
          ) : ventes.articles.length === 0 ? (
            <EtatVide titre="Aucune vente" message="Aucune facture client sur la période." compact />
          ) : (
            <BarresHorizontales donnees={ventes.articles} cleLibelle="designation" cleValeur="montant" formaterValeur={formatMontantArrondi} couleur="var(--gold)" libelleSerie="Chiffre d'affaires" />
          )}
        </Carte>
      </GrilleBlocs>
    </Page>
  )
}
