import { z } from "zod"

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const frenchMobileRegex = /^(06|07)\d{8}$/

export const artisanRegisterSchema = z.object({
  name: z.string().min(2, "Le nom et prenom du gerant sont requis"),
  email: z
    .string()
    .min(1, "L'email est requis")
    .refine((value) => value.includes("@"), "L'email doit contenir un @")
    .email("Email invalide"),
  password: z.string().regex(
    strongPasswordRegex,
    "Le mot de passe doit contenir 8 caracteres minimum, une majuscule, une minuscule, un chiffre et un caractere special"
  ),
  phone: z.string().regex(
    frenchMobileRegex,
    "Le numero de telephone doit commencer par 06 ou 07 et contenir 10 chiffres"
  ),
  profileType: z.enum(["ARTISAN", "DONNEUR"]),
  legalName: z.string().min(2, "La raison sociale est requise"),
  siren: z.string().length(9, "Le SIREN doit contenir 9 chiffres"),
  address: z.string().min(3, "Adresse requise"),
  postalCode: z.string().min(4, "Code postal requis"),
  city: z.string().min(2, "Ville requise"),
  kbisUrl: z.string().url("Le KBIS est requis"),
  insuranceDecennaleUrl: z.string().url("L'attestation decennale est requise"),
  identityCardFrontUrl: z.string().url("La carte d'identite recto est requise"),
  identityCardBackUrl: z.string().url("La carte d'identite verso est requise"),
})

export type ArtisanRegisterInput = z.infer<typeof artisanRegisterSchema>
