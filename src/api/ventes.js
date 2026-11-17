/*
 * Ventes (chef magasin) — clients, demandes, factures client.
 * Demandes et factures s'écrivent uniquement par RPC ; clients : écritures directes autorisées au chef.
 */
import { supabase } from '@/lib/supabase'
import { deballer } from '@/lib/erreurs'
import { appelerRpc } from '@/lib/requetes'

const vide = (v) => (v === '' || v === undefined ? null : v)

export const CANAUX = {
  TELEPHONE: 'Téléphone',
  FAX: 'Fax',
  SUR_PLACE: 'Sur place',
}

/* ---------- Clients ---------- */

/** Clients avec le nombre de demandes et le total facturé */
export async function listerClients() {
  const lignes = deballer(
    await supabase.from('client').select('*, demande_client(id_demande, etat, facture_client(montant_total))').order('nom'),
  )
  return lignes.map(({ demande_client: demandes, ...c }) => ({
    ...c,
    nb_demandes: demandes?.length ?? 0,
    total_facture: (demandes ?? []).reduce((total, d) => {
      const f = Array.isArray(d.facture_client) ? d.facture_client[0] : d.facture_client
      return total + Number(f?.montant_total ?? 0)
    }, 0),
  }))
}

export async function creerClient({ nom, telephone, adresse }) {
  return deballer(
    await supabase.from('client').insert({ nom: nom.trim(), telephone: vide(telephone), adresse: vide(adresse) }).select().single(),
  )
}

export async function modifierClient(id, { nom, telephone, adresse }) {
  return deballer(
    await supabase
      .from('client')
      .update({ nom: nom.trim(), telephone: vide(telephone), adresse: vide(adresse) })
      .eq('id_client', id)
      .select()
      .single(),
  )
}

/* ---------- Demandes ---------- */

const SELECT_DEMANDE =
  '*, client(id_client, nom, telephone, adresse, actif), ligne_demande(id_produit, quantite, prix_unitaire, produit(id_produit, code, designation, unite, quantite_stock, prix_vente, actif)), facture_client(*)'

function enrichirDemande(d) {
  const facture = Array.isArray(d.facture_client) ? d.facture_client[0] : d.facture_client
  const lignes = d.ligne_demande ?? []
  return {
    ...d,
    facture: facture ?? null,
    lignes,
    nb_articles: lignes.length,
    montant: lignes.reduce((t, l) => t + Number(l.quantite) * Number(l.prix_unitaire), 0),
  }
}

export async function listerDemandes() {
  return deballer(
    await supabase.from('demande_client').select(SELECT_DEMANDE).order('date_demande', { ascending: false }).order('id_demande', { ascending: false }),
  ).map(enrichirDemande)
}

export async function lireDemande(id) {
  return enrichirDemande(deballer(await supabase.from('demande_client').select(SELECT_DEMANDE).eq('id_demande', id).single()))
}

/** Nouvelle demande → id ; le prix de chaque ligne est repris de la fiche article par le serveur */
export async function enregistrerDemande({ idClient, canal, date, lignes }) {
  return appelerRpc(supabase, 'enregistrer_demande', {
    p_id_client: Number(idClient),
    p_canal: canal,
    p_date: date,
    p_lignes: lignes.map((l) => ({ id_produit: Number(l.id_produit), quantite: Number(l.quantite) })),
  })
}

export async function modifierDemande(id, { canal, lignes }) {
  return appelerRpc(supabase, 'modifier_demande', {
    p_id_demande: id,
    p_canal: canal,
    p_lignes: lignes.map((l) => ({ id_produit: Number(l.id_produit), quantite: Number(l.quantite) })),
  })
}

export async function annulerDemande(id) {
  return appelerRpc(supabase, 'annuler_demande', { p_id_demande: id })
}

/* ---------- Factures client ---------- */

const SELECT_FACTURE =
  '*, demande_client(id_demande, date_demande, canal, client(id_client, nom, telephone, adresse), ligne_demande(id_produit, quantite, prix_unitaire, produit(code, designation, unite)))'

export async function listerFacturesClient({ depuis } = {}) {
  let requete = supabase.from('facture_client').select(SELECT_FACTURE).order('date_facture', { ascending: false }).order('id_facture_c', { ascending: false })
  if (depuis) requete = requete.gte('date_facture', depuis)
  return deballer(await requete)
}

export async function lireFactureClient(id) {
  return deballer(await supabase.from('facture_client').select(SELECT_FACTURE).eq('id_facture_c', id).single())
}

/**
 * Établit la facture d'une demande en attente.
 * → { ok: true, id_facture, numero, montant_total, alertes } ou { ok: false, manquants }
 */
export async function etablirFactureClient(idDemande) {
  return appelerRpc(supabase, 'etablir_facture_client', { p_id_demande: idDemande })
}
