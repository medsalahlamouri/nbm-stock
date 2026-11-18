/*
 * Règles de saisie partagées (zod) : contrôles des formulaires, messages en français.
 */
import { z } from 'zod'
import { dateISO } from '@/lib/format'

/** Téléphone tunisien facultatif : 8 chiffres (les espaces saisis sont retirés) */
export const telephone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, ''))
  .refine((v) => v === '' || /^\d{8}$/.test(v), 'Le téléphone doit comporter 8 chiffres.')

/** E-mail facultatif */
export const emailFacultatif = z
  .string()
  .trim()
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Adresse e-mail invalide.')

export const emailObligatoire = z
  .string()
  .trim()
  .min(1, "L'adresse e-mail est obligatoire.")
  .pipe(z.email('Adresse e-mail invalide.'))

/** Nombre saisi dans un champ texte (virgule acceptée) */
export const nombre = (message = 'Saisissez un nombre.') =>
  z
    .union([z.string(), z.number()])
    .transform((v) =>
      typeof v === 'number' ? v : Number(String(v).replace(',', '.').replace(/\s/g, '')),
    )
    .refine((v) => !Number.isNaN(v) && String(v) !== '', message)

/** Identité et coordonnées d'un utilisateur (Mon compte, création et modification d'un chef) */
export const schemaIdentite = z.object({
  prenom: z.string().trim().min(1, 'Le prénom est obligatoire.').max(60),
  nom: z.string().trim().min(1, 'Le nom est obligatoire.').max(60),
  email: emailObligatoire,
  telephone,
  date_naissance: z
    .string()
    .refine((v) => v === '' || new Date(v) < new Date(), 'La date de naissance doit être passée.'),
  adresse: z.string().trim().max(200),
  ville: z.string().trim().max(80),
  code_postal: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}$/.test(v), 'Le code postal tunisien comporte 4 chiffres.'),
})

export const valeursIdentite = (u) => ({
  prenom: u?.prenom ?? '',
  nom: u?.nom ?? '',
  email: u?.email ?? '',
  telephone: u?.telephone ?? '',
  date_naissance: u?.date_naissance ? dateISO(u.date_naissance) : '',
  adresse: u?.adresse ?? '',
  ville: u?.ville ?? '',
  code_postal: u?.code_postal ?? '',
})

/** Règles du mot de passe (maquette 1b) */
export const REGLES_MOT_DE_PASSE = [
  { libelle: '8 caractères minimum', test: (v) => v.length >= 8 },
  { libelle: 'Au moins un chiffre', test: (v) => /\d/.test(v) },
  { libelle: 'Au moins une majuscule', test: (v) => /[A-ZÀ-Ý]/.test(v) },
  { libelle: 'Au moins une minuscule', test: (v) => /[a-zà-ÿ]/.test(v) },
]

export const motDePasseValide = (valeur) => REGLES_MOT_DE_PASSE.every((r) => r.test(valeur ?? ''))
