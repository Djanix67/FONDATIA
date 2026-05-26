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

export const marketCreateSchema = z
  .object({
    title: z.string().trim().min(6, "Le titre du marche est requis").max(120, "Titre trop long"),
    description: z
      .string()
      .trim()
      .min(40, "La description doit contenir au moins 40 caracteres")
      .max(4000, "Description trop longue"),
    activity: z.string().trim().min(2, "L'activite recherchee est requise").max(80, "Activite trop longue"),
    city: z.string().trim().min(2, "La ville est requise").max(80, "Ville trop longue"),
    postalCode: z.string().trim().min(4, "Le code postal est requis").max(10, "Code postal invalide"),
    budgetMin: z.coerce.number().int().min(0).optional().nullable(),
    budgetMax: z.coerce.number().int().min(0).optional().nullable(),
    timeframe: z.string().trim().max(120, "Delai trop long").optional().nullable(),
    desiredStartDate: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.budgetMin == null || data.budgetMax == null) {
        return true
      }

      return data.budgetMax >= data.budgetMin
    },
    {
      message: "Le budget maximum doit etre superieur ou egal au budget minimum",
      path: ["budgetMax"],
    }
  )

export const marketAdminStatusSchema = z.object({
  status: z.enum(["PENDING_REVIEW", "LIVE", "REJECTED", "ARCHIVED"]),
  adminNotes: z.string().trim().max(600).optional().nullable(),
  rejectionReason: z.string().trim().max(600).optional().nullable(),
})

export const marketAssignmentSchema = z.object({
  marketId: z.string().trim().min(1),
  assignedArtisanCompanyId: z.string().trim().min(1),
  executionStatus: z.enum(["ASSIGNED", "COMPLETED"]),
})

export const marketExecutionStatusSchema = z.object({
  marketId: z.string().trim().min(1),
  executionStatus: z.enum(["ASSIGNED", "COMPLETED"]),
})

export type ArtisanRegisterInput = z.infer<typeof artisanRegisterSchema>
export type MarketCreateInput = z.infer<typeof marketCreateSchema>
export type MarketAdminStatusInput = z.infer<typeof marketAdminStatusSchema>
export type MarketAssignmentInput = z.infer<typeof marketAssignmentSchema>
export type MarketExecutionStatusInput = z.infer<typeof marketExecutionStatusSchema>
