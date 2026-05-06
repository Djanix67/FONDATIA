import { z } from "zod"

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/

export const artisanRegisterSchema = z.object({
  name: z.string().min(2, "Le nom et prenom du gerant sont requis"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .regex(
      strongPasswordRegex,
      "Le mot de passe doit contenir 8 caracteres minimum, une majuscule, une minuscule et un caractere special"
    ),
  phone: z.string().min(6, "Telephone requis"),
  profileType: z.enum(["ARTISAN", "DONNEUR"]),
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
