import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { CompanyStatus } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { getCompanyStatusCopy } from "@/lib/company-status"

export default async function ArtisanPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/artisan")
  }

  const role = (session.user as { role?: string }).role

  if (role !== "ARTISAN") {
    redirect("/acces-interdit")
  }

  const company = await prisma.company.findUnique({
    where: { userId: String((session.user as { id?: string }).id ?? "") },
  })

  const fallbackStatus = (session.user as { companyStatus?: string }).companyStatus ?? "PENDING"
  const status = (company?.status ?? fallbackStatus) as CompanyStatus
  const statusCopy = getCompanyStatusCopy(status)
  const documentItems = [
    {
      label: "KBIS",
      ready: Boolean(company?.kbisUrl),
    },
    {
      label: "Assurance decennale",
      ready: Boolean(company?.insuranceDecennaleUrl),
    },
    {
      label: "Carte d'identite recto",
      ready: Boolean(company?.identityCardFrontUrl),
    },
    {
      label: "Carte d'identite verso",
      ready: Boolean(company?.identityCardBackUrl),
    },
  ]

  const completedDocuments = documentItems.filter((item) => item.ready).length
  const nextSteps = getNextSteps(status, company?.rejectedReason)

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10">
      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Espace artisan
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Tableau de bord dossier
          </h1>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
            <p className="text-sm text-slate-400">Statut du dossier</p>
            <div className="mt-4 flex items-center gap-3">
              <span className={`status-dot ${statusCopy.dotClass}`} />
              <span className={`text-lg font-medium ${statusCopy.toneClass}`}>{status}</span>
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-semibold text-white">{statusCopy.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            {statusCopy.description}
          </p>

          {company?.rejectedReason ? (
            <div className="mt-8 rounded-[1.5rem] border border-rose-300/20 bg-rose-300/10 p-5">
              <p className="text-sm text-rose-100">Motif communique</p>
              <p className="mt-3 text-sm leading-7 text-rose-50">{company.rejectedReason}</p>
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Documents recus" value={`${completedDocuments}/4`} />
            <MetricCard
              label="Dossier cree le"
              value={company ? formatDate(company.createdAt) : "Non disponible"}
            />
            <MetricCard
              label="Valide le"
              value={company?.validatedAt ? formatDate(company.validatedAt) : "Non valide"}
            />
          </div>

          <GlassCard className="p-8">
            <p className="text-sm text-slate-400">Entreprise</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Raison sociale", company?.legalName ?? "Non renseignee"],
                ["Email", company?.email ?? session.user.email ?? "Non renseigne"],
                ["Telephone", company?.phone ?? "Non renseigne"],
                ["Ville", company?.city ?? "Non renseignee"],
                ["SIREN", company?.siren ?? "Non renseigne"],
                ["SIRET", company?.siret ?? "Non renseigne"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4"
                >
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-base font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <p className="text-sm text-slate-400">Documents entreprise</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {documentItems.map((document) => (
                <div
                  key={document.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4"
                >
                  <p className="text-sm text-slate-400">{document.label}</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {document.ready ? "Document recu" : "Document manquant"}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <p className="text-sm text-slate-400">Prochaines etapes</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {nextSteps.map((step) => (
                <li
                  key={step}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4"
                >
                  {step}
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>
      </div>
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function getNextSteps(status: CompanyStatus, rejectedReason?: string | null) {
  if (status === "APPROVED") {
    return [
      "Votre dossier est valide et pret pour les futures opportunites diffusees sur la plateforme.",
      "Les prochains lots produit prepareront les leads qualifies, les notifications et la monetisation.",
      "Conservez vos informations entreprise et vos justificatifs a jour pour garder un profil exploitable.",
    ]
  }

  if (status === "REJECTED") {
    return [
      rejectedReason
        ? `Point a corriger : ${rejectedReason}`
        : "Un refus a ete enregistre sur le dossier. Un motif plus detaille peut etre communique par l'equipe.",
      "Une nouvelle iteration pourra permettre de representer un dossier plus complet.",
      "Preparez les documents et informations manquants avant une future relecture.",
    ]
  }

  if (status === "BLOCKED") {
    return [
      "Le compte est suspendu ou bloque a ce stade.",
      "L'equipe FONDATIA peut reevaluer la situation avant une reouverture eventuelle.",
      "Le dashboard garde une lecture claire de l'etat meme en cas de suspension.",
    ]
  }

  return [
    "Votre dossier est en cours de verification par l'equipe FONDATIA.",
    "Assurez-vous que vos informations entreprise et vos quatre justificatifs sont complets et lisibles.",
    "Le statut evoluera automatiquement ici apres validation admin.",
  ]
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value)
}
