import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { getCompanyStatusCopy } from "@/lib/company-status"

export default async function ArtisanPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user as { role?: string }).role

  if (role !== "ARTISAN") {
    redirect("/acces-interdit")
  }

  const company = await prisma.company.findUnique({
    where: { userId: String((session.user as { id?: string }).id ?? "") },
  })

  const fallbackStatus = (session.user as { companyStatus?: string }).companyStatus ?? "PENDING"
  const status = company?.status ?? fallbackStatus
  const statusCopy = getCompanyStatusCopy(status)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.18em] text-white/40">
            Espace artisan
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Tableau de bord dossier
          </h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <GlassCard className="p-8">
            <p className="text-sm text-white/45">Statut actuel</p>
            <h2 className={`mt-4 text-3xl font-semibold ${statusCopy.toneClass}`}>
              {status}
            </h2>
            <h3 className="mt-4 text-2xl font-semibold text-white">{statusCopy.title}</h3>
            <p className="mt-4 text-base leading-7 text-white/65">{statusCopy.description}</p>
          </GlassCard>

          <div className="grid gap-6">
            <GlassCard className="p-8">
              <p className="text-sm text-white/45">Entreprise</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Raison sociale", company?.legalName ?? "Non renseignee"],
                  ["Email", company?.email ?? session.user.email ?? "Non renseigne"],
                  ["Telephone", company?.phone ?? "Non renseigne"],
                  ["Ville", company?.city ?? "Non renseignee"],
                  ["SIREN", company?.siren ?? "Non renseigne"],
                  ["SIRET", company?.siret ?? "Non renseigne"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/45">{label}</p>
                    <p className="mt-2 text-base font-medium text-white">{value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <p className="text-sm text-white/45">Suite du produit</p>
              <ul className="mt-6 space-y-3 text-sm text-white/70">
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Upload KBIS et assurance decennale via Supabase Storage
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Emails transactionnels selon le statut du dossier
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Base preparee pour leads qualifies et monetisation
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </main>
  )
}
