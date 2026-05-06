"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED"

type Props = {
  companyId: string
  currentStatus: CompanyStatus
}

export function CompanyStatusActions({ companyId, currentStatus }: Props) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [loadingAction, setLoadingAction] = useState<"APPROVED" | "REJECTED" | null>(null)

  const updateStatus = (status: "APPROVED" | "REJECTED") => {
    setError("")
    setLoadingAction(status)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/companies/${companyId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || "Erreur inconnue")
        }

        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setLoadingAction(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateStatus("APPROVED")}
          disabled={isPending || currentStatus === "APPROVED"}
          className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "APPROVED" ? "Validation..." : "Valider"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("REJECTED")}
          disabled={isPending || currentStatus === "REJECTED"}
          className="rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "REJECTED" ? "Refus..." : "Refuser"}
        </button>
      </div>

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  )
}