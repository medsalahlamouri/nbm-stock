import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/config/supabase'

/*
 * Client Supabase unique de l'application : seul point d'accès au back-end
 * (Auth, API de données, fonctions RPC, Edge Functions, Storage).
 * La session est conservée dans le navigateur et le jeton est renouvelé automatiquement.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
