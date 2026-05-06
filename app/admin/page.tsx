import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { CompanyStatusActions } from "@/components/admin/company-status-actions"

type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED"

type AdminPageProps = {
  searchParams: Promise<{
    status?: CompanyStatus
  }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }

  const role = (session.user as { role?: string }).role

  if (role !== "ADMIN") {
    redirect("/acces-interdit")
  }

  const params = await searchParams
  const selectedStatus = params.status

  const [companies, totalCompanies, pendingCount, approvedCount, rejectedCount, blockedCount] =
    await Promise.all([
      prisma.company.findMany({
        where: selectedStatus ? { status: selectedStatus } : undefined,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      prisma.company.count(),
      prisma.company.count({ where: { status: "PENDING" } }),
      prisma.company.count({ where: { status: "APPROVED" } }),
      prisma.company.count({ where: { status: "REJECTED" } }),
      prisma.company.count({ where: { status: "BLOCKED" } }),
    ])

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Back office admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pilotage des dossiers artisans
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-300">
            Cette vue devient le coeur operationnel du MVP : lecture des dossiers,
            controle des documents, changement de statut et synchronisation avec le dashboard artisan.
          </p>
        </div>
        <Link
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          href="/api/auth/signout?callbackUrl=/"
        >
          Se deconnecter
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Entreprises" value={totalCompanies} />
        <StatCard label="En attente" value={pendingCount} />
        <StatCard label="Approuves" value={approvedCount} />
        <StatCard label="Refuses" value={rejectedCount} />
        <StatCard label="Bloques" value={blockedCount} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <FilterLink href="/admin" active={!selectedStatus}>
          Tous
        </FilterLink>
        <FilterLink href="/admin?status=PENDING" active={selectedStatus === "PENDING"}>
          PENDING
        </FilterLink>
        <FilterLink href="/admin?status=APPROVED" active={selectedStatus === "APPROVED"}>
          APPROVED
        </FilterLink>
        <FilterLink href="/admin?status=REJECTED" active={selectedStatus === "REJECTED"}>
          REJECTED
        </FilterLink>
        <FilterLink href="/admin?status=BLOCKED" active={selectedStatus === "BLOCKED"}>
          BLOCKED
        </FilterLink>
      </div>

      <div className="mt-8 grid gap-6">
        {companies.length === 0 ? (
          <GlassCard className="p-8">
            <p className="text-base text-slate-300">
              Aucun dossier ne correspond au filtre en cours.
            </p>
          </GlassCard>
        ) : (
          companies.map((company) => {
            const documents = [
              {
                label: "KBIS",
                ready: Boolean(company.kbisUrl),
              },
              {
                label: "Assurance decennale",
                ready: Boolean(company.insuranceDecennaleUrl),
              },
            ]

            return (
              <GlassCard key={company.id} className="p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-white">{company.legalName}</h2>
                      <StatusBadge status={company.status as CompanyStatus} />
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        ["Email", company.email],
                        ["Telephone", company.phone],
                        ["Ville", company.city],
                        ["Adresse", company.address],
                        ["SIREN", company.siren],
                        ["SIRET", company.siret],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4"
                        >
                          <p className="text-sm text-slate-400">{label}</p>
                          <p className="mt-2 text-sm font-medium text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {documents.map((document) => (
                        <div
                          key={document.label}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                        >
                          {document.label} : {document.ready ? "recu" : "manquant"}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
                        <p className="text-sm text-slate-400">Dossier cree le</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {formatDate(company.createdAt)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
                        <p className="text-sm text-slate-400">Derniere validation</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {company.validatedAt ? formatDate(company.validatedAt) : "Non valide"}
                        </p>
                      </div>
                    </div>

                    {company.rejectedReason ? (
                      <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-4">
                        <p className="text-sm text-rose-100">Motif de refus enregistre</p>
                        <p className="mt-2 text-sm leading-7 text-rose-50">
                          {company.rejectedReason}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full max-w-xl rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-sm text-slate-400">Action admin</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Mettez a jour le statut du dossier. Le compte utilisateur est synchronise,
                      et les emails dossier valide ou refuse sont prepares automatiquement.
                    </p>
                    <div className="mt-5">
                      <CompanyStatusActions
                        companyId={company.id}
                        currentStatus={company.status as CompanyStatus}
                        rejectedReason={company.rejectedReason}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })
        )}
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </section>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      className={[
        "rounded-full border px-4 py-2 transition",
        active
          ? "border-sky-300/30 bg-sky-300/15 text-white"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
      ].join(" ")}
      href={href}
    >
      {children}
    </Link>
  )
}

function StatusBadge({ status }: { status: CompanyStatus }) {
  const classes = {
    PENDING: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    APPROVED: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    REJECTED: "border-rose-300/20 bg-rose-300/10 text-rose-100",
    BLOCKED: "border-slate-300/20 bg-slate-300/10 text-slate-100",
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${classes[status]}`}>
      {status}
    </span>
  )
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value)
}
