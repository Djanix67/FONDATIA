import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

export const companyDocumentTypeSchema = z.enum([
  "kbis",
  "insuranceDecennale",
  "identityCardFront",
  "identityCardBack",
])

export type CompanyDocumentType = z.infer<typeof companyDocumentTypeSchema>

export const documentUploadRequestSchema = z.object({
  documentType: companyDocumentTypeSchema,
  fileName: z.string().min(1),
  contentType: z.string().min(1),
})

const storageConfigSchema = z.object({
  supabaseUrl: z.string().url(),
  serviceRoleKey: z.string().min(1),
  bucket: z.string().min(1),
})

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const maxUploadSize = 10 * 1024 * 1024

function resolveSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
}

export function getStorageConfig() {
  try {
    return storageConfigSchema.parse({
      supabaseUrl: resolveSupabaseUrl(),
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "company-documents",
    })
  } catch {
    throw new Error(
      "Configuration Supabase manquante. Ajoutez SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL, ainsi que SUPABASE_SERVICE_ROLE_KEY dans le .env."
    )
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")
}

function createStorageClient() {
  const config = getStorageConfig()

  return {
    config,
    supabase: createClient(config.supabaseUrl, config.serviceRoleKey),
  }
}

export function buildCompanyDocumentPath({
  ownerKey,
  documentType,
  fileName,
}: {
  ownerKey: string
  documentType: CompanyDocumentType
  fileName: string
}) {
  return `${ownerKey}/${documentType}/${Date.now()}-${sanitizeFileName(fileName)}`
}

function buildStorageObjectUrl(bucket: string, path: string) {
  const { supabaseUrl } = getStorageConfig()
  return `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
}

export function validateCompanyDocumentFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Format non pris en charge. Utilisez PDF, JPG, PNG ou WEBP.")
  }

  if (file.size > maxUploadSize) {
    throw new Error("Fichier trop volumineux. Limite : 10 Mo.")
  }
}

export async function uploadSignupDocument({
  draftId,
  documentType,
  file,
}: {
  draftId: string
  documentType: CompanyDocumentType
  file: File
}) {
  validateCompanyDocumentFile(file)

  const { config, supabase } = createStorageClient()
  const path = buildCompanyDocumentPath({
    ownerKey: `signup-drafts/${draftId}`,
    documentType,
    fileName: file.name,
  })

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage.from(config.bucket).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw new Error("Impossible de televerser le document pour l'instant.")
  }

  return {
    bucket: config.bucket,
    path,
    url: buildStorageObjectUrl(config.bucket, path),
    contentType: file.type,
  }
}
