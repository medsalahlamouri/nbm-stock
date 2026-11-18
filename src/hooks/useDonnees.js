/*
 * Hooks de lecture partagés entre plusieurs écrans (TanStack Query).
 * Chaque hook associe une clé de cache à une fonction de src/api/.
 */
import { useQuery } from '@tanstack/react-query'
import { listerEtatStock } from '@/api/stock'
import {
  listerCommandes,
  listerDevis,
  listerEvaluations,
  listerFournisseurs,
  listerRetards,
  prixAchatParMP,
} from '@/api/achats'
import { listerClients, listerDemandes, listerFacturesClient } from '@/api/ventes'
import { listerChefs } from '@/api/utilisateurs'
import { RAFRAICHISSEMENT_PERIODIQUE } from '@/lib/requetes'

export const useEtatStock = (options = {}) =>
  useQuery({ queryKey: ['etat-stock'], queryFn: listerEtatStock, ...options })

export const useFournisseurs = () =>
  useQuery({ queryKey: ['fournisseurs'], queryFn: listerFournisseurs })

export const useEvaluations = () =>
  useQuery({ queryKey: ['evaluation'], queryFn: listerEvaluations })

export const useDevis = () => useQuery({ queryKey: ['devis'], queryFn: () => listerDevis() })

export const useCommandes = (options = {}) =>
  useQuery({ queryKey: ['commandes'], queryFn: () => listerCommandes(), ...options })

export const useRetards = (options = {}) =>
  useQuery({ queryKey: ['retards'], queryFn: listerRetards, ...options })

export const usePrixAchat = () =>
  useQuery({ queryKey: ['etat-stock', 'prix-achat'], queryFn: prixAchatParMP })

export const useClients = () => useQuery({ queryKey: ['clients'], queryFn: listerClients })

export const useDemandes = (options = {}) =>
  useQuery({ queryKey: ['demandes'], queryFn: listerDemandes, ...options })

export const useFacturesClient = (options = {}) =>
  useQuery({ queryKey: ['factures-client'], queryFn: () => listerFacturesClient(), ...options })

export const useChefs = () => useQuery({ queryKey: ['utilisateurs'], queryFn: listerChefs })

/** Options pour les données des tableaux de bord : rafraîchies toutes les minutes */
export const periodique = { refetchInterval: RAFRAICHISSEMENT_PERIODIQUE }
