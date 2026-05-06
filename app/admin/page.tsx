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
    redirect("/")
  }

  const role = (session.user as { role?: string }).role

  if (role !== "ADMIN") {
    redirect("/")
  }

  const params = await searchParams
  const selectedStatus = params.status

  const companies = await prisma.company.findMany({
    where: selectedStatus ? { status: selectedStatus } : undefined,
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Entreprises artisan
            </h1>
            <p className="mt-3 text-sm text-white/60">
              Gérez les inscriptions et validez les entreprises.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterButton href="/admin" active={!selectedStatus}>
              Tous
            </FilterButton>
            <FilterButton
              href="/admin?status=PENDING"
              active={selectedStatus === "PENDING"}
            >
              PENDING
            </FilterButton>
            <FilterButton
              href="/admin?status=APPROVED"
              active={selectedStatus === "APPROVED"}
            >
              APPROVED
            </FilterButton>
            <FilterButton
              href="/admin?status=REJECTED"
              active={selectedStatus === "REJECTED"}
            >
              REJECTED
            </FilterButton>
          </div>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr className="text-xs uppercase tracking-[0.18em] text-white/45">
                  <th className="px-6 py-4 font-medium">Nom</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium">Ville</th>
                  <th className="px-6 py-4 font-medium">SIREN</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-white/50"
                    >
                      Aucune entreprise trouvée pour ce filtre.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr
                      key={company.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-5 font-medium text-white">
                        {company.legalName}
                      </td>
                      <td className="px-6 py-5 text-sm text-white/70">
                        {company.email}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={company.status as CompanyStatus} />
                      </td>
                      <td className="px-6 py-5 text-sm text-white/70">
                        {company.city}
                      </td>
                      <td className="px-6 py-5 text-sm text-white/70">
                        {company.siren}
                      </td>
                      <td className="px-6 py-5">
                        <CompanyStatusActions
                          companyId={company.id}
                          currentStatus={
                            company.status as "PENDING" | "APPROVED" | "REJECTED"
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </main>
  )
}

function FilterButton({
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
      href={href}
      className={[
        "rounded-2xl border px-4 py-2 text-sm transition",
        active
          ? "border-white/15 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {children}
    </Link>
  )
}

function StatusBadge({ status }: { status: CompanyStatus }) {
  const styles = {
    PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    APPROVED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    REJECTED: "border-red-400/20 bg-red-400/10 text-red-200",
    BLOCKED: "border-zinc-400/20 bg-zinc-400/10 text-zinc-200",
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  )
}