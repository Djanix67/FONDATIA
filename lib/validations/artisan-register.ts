import { z } from "zod"

export const artisanRegisterSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
  phone: z.string().min(6, "Telephone requis"),
  legalName: z.string().min(2, "La raison sociale est requise"),
  siren: z.string().length(9, "Le SIREN doit contenir 9 chiffres"),
  siret: z.string().length(14, "Le SIRET doit contenir 14 chiffres"),
  address: z.string().min(3, "Adresse requise"),
  postalCode: z.string().min(4, "Code postal requis"),
  city: z.string().min(2, "Ville requise"),
  kbisUrl: z.string().min(1, "Le KBIS est requis"),
  insuranceDecennaleUrl: z.string().min(1, "L'assurance decennale est requise"),
})

export type ArtisanRegisterInput = z.infer<typeof artisanRegisterSchema>
