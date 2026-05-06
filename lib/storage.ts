import { z } from "zod"

export const documentUploadRequestSchema = z.object({
  documentType: z.enum(["kbis", "insuranceDecennale"]),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
})

const storageConfigSchema = z.object({
  supabaseUrl: z.string().url(),
  serviceRoleKey: z.string().min(1),
  bucket: z.string().min(1),
})

export function getStorageConfig() {
  return storageConfigSchema.parse({
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "company-documents",
  })
}

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")
}

export function buildCompanyDocumentPath({
  userId,
  documentType,
  fileName,
}: {
  userId: string
  documentType: "kbis" | "insuranceDecennale"
  fileName: string
}) {
  return `${userId}/${documentType}/${Date.now()}-${sanitizeFileName(fileName)}`
}

export function prepareCompanyDocumentUpload({
  userId,
  documentType,
  fileName,
  contentType,
}: {
  userId: string
  documentType: "kbis" | "insuranceDecennale"
  fileName: string
  contentType: string
}) {
  const config = getStorageConfig()
  const path = buildCompanyDocumentPath({ userId, documentType, fileName })

  return {
    provider: "supabase-storage",
    bucket: config.bucket,
    path,
    contentType,
    uploadStrategy: "signed-upload-url",
  }
}
