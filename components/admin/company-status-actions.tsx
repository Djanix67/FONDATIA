"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"

type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED"

type CompanyStatusActionsProps = {
  companyId: string
  currentStatus: CompanyStatus
  rejectedReason?: string | null
}

export function CompanyStatusActions({
  companyId,
  currentStatus,
  rejectedReason,
}: CompanyStatusActionsProps) {
  const router = useRouter()
  const [status, setStatus] = useState<CompanyStatus>(currentStatus)
  const [reason, setReason] = useState(rejectedReason ?? "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const needsReason = useMemo(() => status === "REJECTED", [status])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const response = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          rejectedReason: needsReason ? reason : undefined,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        setError(payload?.error ?? "Impossible de mettre a jour le dossier.")
        return
      }

      setSuccess("Statut mis a jour.")
      router.refresh()
    })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as CompanyStatus)}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          disabled={isPending}
        >
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Mise a jour..." : "Mettre a jour"}
        </button>
      </div>

      {needsReason ? (
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          placeholder="Motif de refus interne ou communique a l'artisan"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-sky-300/60"
          disabled={isPending}
        />
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}
    </form>
  )
}
