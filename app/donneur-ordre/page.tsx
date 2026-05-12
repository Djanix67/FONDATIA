import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { marketCreateSchema } from "@/lib/validations/artisan-register"

type DonneurOrdrePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type MarketStatus = "PENDING_REVIEW" | "LIVE" | "REJECTED" | "ARCHIVED"

export default async function DonneurOrdrePage({ searchParams }: DonneurOrdrePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const role = (session.user as { role?: string; id?: string }).role
  const userId = (session.user as { role?: string; id?: string }).id

  if (role !== "DONNEUR") {
    redirect("/acces-interdit")
  }

  if (!userId) {
    redirect("/login")
  }

  const params = (await searchParams) ?? {}
  const created = params.created === "1"
  const error = typeof params.error === "string" ? params.error : ""

  const donor = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
      markets: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!donor?.company) {
    redirect("/acces-interdit")
  }

  async function createMarketAction(formData: FormData) {
    "use server"

    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as { role?: string; id?: string }).role !== "DONNEUR") {
      redirect("/login")
    }

    const currentUserId = (session.user as { role?: string; id?: string }).id

    if (!currentUserId) {
      redirect("/login")
    }

    const owner = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { company: true },
    })

    if (!owner?.company) {
      redirect("/donneur-ordre?error=missing-company")
    }

    const rawData = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      activity: String(formData.get("activity") ?? ""),
      city: String(formData.get("city") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      budgetMin: normalizeNumber(formData.get("budgetMin")),
      budgetMax: normalizeNumber(formData.get("budgetMax")),
      timeframe: normalizeString(formData.get("timeframe")),
      desiredStartDate: normalizeString(formData.get("desiredStartDate")),
    }

    const parsed = marketCreateSchema.safeParse(rawData)

    if (!parsed.success) {
      redirect("/donneur-ordre?error=invalid-market")
    }

    await prisma.market.create({
      data: {
        ownerUserId: owner.id,
        ownerCompanyId: owner.company.id,
        title: parsed.data.title,
        description: parsed.data.description,
        activity: parsed.data.activity,
        city: parsed.data.city,
        postalCode: parsed.data.postalCode,
        budgetMin: parsed.data.budgetMin ?? null,
        budgetMax: parsed.data.budgetMax ?? null,
        timeframe: parsed.data.timeframe ?? null,
        desiredStartDate: parsed.data.desiredStartDate
          ? new Date(`${parsed.data.desiredStartDate}T00:00:00.000Z`)
          : null,
      },
    })

    revalidatePath("/donneur-ordre")
    redirect("/donneur-ordre?created=1")
  }

  const liveCount = donor.markets.filter((market) => market.status === "LIVE").length
  const reviewCount = donor.markets.filter((market) => market.status === "PENDING_REVIEW").length

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(38,99,235,0.14),transparent_28%),linear-gradient(180deg,#030712_0%,#06111f_40%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">Espace donneur d'ordre</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Pilotage des demandes de chantier</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
              Cet espace permet maintenant de deposer un marche, de suivre sa validation admin et de preparer la mise en relation premium avec les artisans FONDATIA.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Marches deposes" value={donor.markets.length} />
            <StatTile label="En validation" value={reviewCount} />
            <StatTile label="En ligne" value={liveCount} />
          </div>
        </div>

        {created ? (
          <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100">
            Votre marche a bien ete depose. Il apparait maintenant dans la file de validation admin.
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            {error === "invalid-market"
              ? "Merci de verifier les informations du marche avant envoi."
              : "Votre entreprise donneur n'est pas correctement reliee au compte."
            }
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <GlassCard className="p-8">
            <p className="text-sm uppercase tracking-[0.18em] text-white/45">Nouveau marche</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Deposer une demande a faire valider</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              Redige un brief clair, premium et directement exploitable. L'equipe FONDATIA le relira avant publication aux artisans qualifies.
            </p>

            <form action={createMarketAction} className="mt-8 grid gap-5">
              <Field label="Titre du marche" name="title" placeholder="Renovation complete d'un plateau de bureaux" />

              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Activite recherchee" name="activity" placeholder="Renovation TCE" />
                <Field label="Ville" name="city" placeholder="Paris" />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Code postal" name="postalCode" placeholder="75008" />
                <Field label="Delai souhaite" name="timeframe" placeholder="Demarrage sous 3 semaines" />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <Field label="Budget minimum" name="budgetMin" type="number" placeholder="15000" />
                <Field label="Budget maximum" name="budgetMax" type="number" placeholder="30000" />
                <Field label="Date ideale de debut" name="desiredStartDate" type="date" />
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">Description detaillee</span>
                <textarea
                  name="description"
                  rows={7}
                  placeholder="Precisez le contexte, la nature des travaux, les contraintes techniques, le niveau de finition attendu et les delais cles."
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.07]"
                  required
                />
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-sky-400/20 bg-sky-500/15 px-5 py-4 text-sm font-medium text-white transition hover:bg-sky-500/25"
              >
                Envoyer en validation admin
              </button>
            </form>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard className="p-8">
              <p className="text-sm uppercase tracking-[0.18em] text-white/45">Entreprise source</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{donor.company.legalName}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoLine label="Contact" value={donor.name} />
                <InfoLine label="Email" value={donor.email} />
                <InfoLine label="Ville" value={donor.company.city} />
                <InfoLine label="Telephone" value={donor.company.phone} />
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <p className="text-sm uppercase tracking-[0.18em] text-white/45">Suivi des marches</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Historique recent</h2>
              <div className="mt-6 space-y-4">
                {donor.markets.length === 0 ? (
                  <p className="text-sm leading-7 text-white/60">
                    Aucun marche depose pour le moment. Le premier brief envoye apparaitra ici avec son statut de validation.
                  </p>
                ) : (
                  donor.markets.map((market) => (
                    <div key={market.id} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-medium text-white">{market.title}</h3>
                        <StatusBadge status={market.status as MarketStatus} />
                      </div>
                      <p className="mt-2 text-sm text-white/60">{market.activity} • {market.city}</p>
                      <p className="mt-3 text-sm leading-7 text-white/70">{market.description}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <InfoLine label="Budget" value={formatBudget(market.budgetMin, market.budgetMax)} />
                        <InfoLine label="Delai" value={market.timeframe ?? "A confirmer"} />
                      </div>
                      {market.rejectionReason ? (
                        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                          Motif de retour admin : {market.rejectionReason}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string
  name: string
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-3xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.07]"
        required={type !== "number" && type !== "date"}
      />
    </label>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: MarketStatus }) {
  const classes = {
    PENDING_REVIEW: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    LIVE: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    REJECTED: "border-rose-300/20 bg-rose-300/10 text-rose-100",
    ARCHIVED: "border-slate-300/20 bg-slate-300/10 text-slate-100",
  }

  const labels = {
    PENDING_REVIEW: "En validation",
    LIVE: "En ligne",
    REJECTED: "Retour admin",
    ARCHIVED: "Archive",
  }

  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${classes[status]}`}>{labels[status]}</span>
}

function normalizeNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formatBudget(min: number | null, max: number | null) {
  if (min == null && max == null) {
    return "Budget a preciser"
  }

  if (min != null && max != null) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`
  }

  return min != null ? `A partir de ${formatCurrency(min)}` : `Jusqu'a ${formatCurrency(max as number)}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}
