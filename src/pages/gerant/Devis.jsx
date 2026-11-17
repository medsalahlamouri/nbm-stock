/*
 * B6 — Devis (/gerant/devis).
 * Tableau : référence, matière première, fournisseur, date, prix unitaire, délai, montant estimé pour Q*,
 * utilisation (« Utilisé · verrouillé » ou disponible). Filtres : combobox MP et combobox fournisseur.
 * Suppression directe (delete devis) : le serveur refuse si le devis est utilisé dans une commande.
 */
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { FileText, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supprimerDevis } from '@/api/achats'
import { useDevis } from '@/hooks/useDonnees'
import { formatDate, formatMontant, formatNombre, reference } from '@/lib/format'
import { messageErreur } from '@/lib/erreurs'
import { invalider } from '@/lib/requetes'
import { Button } from '@/components/ui/button'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { Badge } from '@/components/commun/Badge'
import { CellulePrincipale, DataTable, Reference } from '@/components/commun/DataTable'
import { EtatVide } from '@/components/commun/Etats'
import { Combobox } from '@/components/commun/Combobox'
import { ActionIcone } from '@/components/commun/ActionIcone'
import { ConfirmDialog, useConfirmation } from '@/components/commun/Dialogues'

export default function Devis() {
  const naviguer = useNavigate()
  const [parametres, setParametres] = useSearchParams()
  const devis = useDevis()
  const confirmation = useConfirmation()
  const idProduit = parametres.get('produit')
  const idFournisseur = parametres.get('fournisseur')
  const changerFiltre = (cle, valeur) =>
    setParametres(
      (p) => {
        if (valeur === null || valeur === undefined) p.delete(cle)
        else p.set(cle, String(valeur))
        return p
      },
      { replace: true },
    )

  const suppression = useMutation({
    mutationFn: (id) => supprimerDevis(id),
    onSuccess: async () => {
      await invalider('achats')
      toast.success('Devis supprimé.')
    },
    onError: (e) => toast.error(messageErreur(e)),
  })

  const liste = useMemo(() => devis.data ?? [], [devis.data])
  const optionsMP = useMemo(
    () => [...new Map(liste.map((d) => [d.produit.id_produit, { valeur: d.produit.id_produit, libelle: d.produit.designation, sousLibelle: d.produit.code }])).values()],
    [liste],
  )
  const optionsFournisseurs = useMemo(
    () => [...new Map(liste.map((d) => [d.fournisseur.id_fournisseur, { valeur: d.fournisseur.id_fournisseur, libelle: d.fournisseur.raison_sociale, sousLibelle: reference('FRN', d.fournisseur.id_fournisseur) }])).values()],
    [liste],
  )
  const filtres = liste.filter(
    (d) => (!idProduit || String(d.produit.id_produit) === idProduit) && (!idFournisseur || String(d.fournisseur.id_fournisseur) === idFournisseur),
  )

  const colonnes = [
    { id: 'ref', entete: 'Devis', tri: (d) => d.id_devis, cellule: (d) => <Reference>{reference('DEV', d.id_devis)}</Reference> },
    {
      id: 'mp',
      entete: 'Matière · fournisseur',
      tri: (d) => d.produit.designation,
      cellule: (d) => <CellulePrincipale titre={d.produit.designation} sousTitre={d.fournisseur.raison_sociale + (d.fournisseur.actif ? '' : ' (inactif)')} />,
    },
    { id: 'date', entete: 'Date', tri: (d) => d.date_devis, cellule: (d) => formatDate(d.date_devis) },
    { id: 'prix', entete: 'Prix unitaire', align: 'right', tri: (d) => Number(d.prix_unitaire), cellule: (d) => formatMontant(d.prix_unitaire) },
    { id: 'delai', entete: 'Délai', align: 'right', tri: (d) => d.delai_livraison, cellule: (d) => `${d.delai_livraison} j` },
    {
      id: 'montant',
      entete: 'Montant pour Q*',
      align: 'right',
      tri: (d) => (d.produit.quantite_economique ?? 0) * d.prix_unitaire,
      cellule: (d) =>
        d.produit.quantite_economique ? (
          <div>
            <div className="font-semibold">{formatMontant(d.produit.quantite_economique * d.prix_unitaire)}</div>
            <div className="text-[12px] text-mutedtxt">Q* = {formatNombre(d.produit.quantite_economique)}</div>
          </div>
        ) : (
          <span className="text-muted2" title="Paramètres de calcul incomplets">—</span>
        ),
    },
    {
      id: 'etat',
      entete: 'Utilisation',
      cellule: (d) =>
        d.utilise ? (
          <Badge ton="neutral" icone={Lock}>
            Utilisé · verrouillé
          </Badge>
        ) : (
          <Badge ton="ok">Modifiable</Badge>
        ),
    },
    {
      id: 'actions',
      entete: 'Actions',
      align: 'right',
      cellule: (d) => (
        <div className="flex justify-end gap-1">
          <ActionIcone libelle={d.utilise ? 'Consulter' : 'Modifier'} icone={Pencil} to={`/gerant/devis/${d.id_devis}/modifier`} />
          {!d.utilise && <ActionIcone libelle="Supprimer" icone={Trash2} ton="danger" onClick={() => confirmation.ouvrir(d)} />}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageEntete
        titre="Devis"
        description="Les prix et délais proposés par les fournisseurs pour chaque matière première. Un devis utilisé dans une commande est verrouillé."
        actions={
          <Button asChild>
            <Link to={`/gerant/devis/nouveau${idProduit ? `?produit=${idProduit}` : idFournisseur ? `?fournisseur=${idFournisseur}` : ''}`}>
              <Plus /> Nouveau devis
            </Link>
          </Button>
        }
      />
      <Carte sansPadding className="gap-0 overflow-hidden">
        <div className="grid gap-3 p-[22px] pb-4 sm:grid-cols-2 lg:max-w-[760px]">
          <Combobox
            libelle="Filtrer par matière première"
            valeur={idProduit}
            onChange={(v) => changerFiltre('produit', v)}
            options={optionsMP}
            placeholder="Toutes les matières premières"
            recherchePlaceholder="Rechercher une matière…"
            effacable
          />
          <Combobox
            libelle="Filtrer par fournisseur"
            valeur={idFournisseur}
            onChange={(v) => changerFiltre('fournisseur', v)}
            options={optionsFournisseurs}
            placeholder="Tous les fournisseurs"
            recherchePlaceholder="Rechercher un fournisseur…"
            effacable
          />
        </div>
        <DataTable
          colonnes={colonnes}
          lignes={filtres}
          cle={(d) => d.id_devis}
          chargement={devis.isPending}
          erreur={devis.error}
          onReessayer={devis.refetch}
          onLigneClick={(d) => naviguer(`/gerant/devis/${d.id_devis}/modifier`)}
          libelleElements="devis affiché(s)"
          triInitial={{ id: 'date', sens: 'desc' }}
          vide={
            <EtatVide
              icone={FileText}
              titre={liste.length ? 'Aucun devis pour ces filtres' : 'Aucun devis enregistré'}
              message={liste.length ? 'Choisissez une autre matière ou un autre fournisseur.' : 'Saisissez les devis reçus des fournisseurs pour pouvoir commander.'}
              action={
                <Button asChild>
                  <Link to="/gerant/devis/nouveau">
                    <Plus /> Nouveau devis
                  </Link>
                </Button>
              }
            />
          }
        />
      </Carte>
      <ConfirmDialog
        {...confirmation.proprietes}
        titre={`Supprimer le devis ${confirmation.cible ? reference('DEV', confirmation.cible.id_devis) : ''} ?`}
        message={confirmation.cible ? `${confirmation.cible.produit.designation} · ${confirmation.cible.fournisseur.raison_sociale} · ${formatMontant(confirmation.cible.prix_unitaire)}. Cette suppression est définitive.` : ''}
        libelleConfirmer="Supprimer le devis"
        onConfirmer={() => suppression.mutateAsync(confirmation.cible.id_devis)}
      />
    </Page>
  )
}
