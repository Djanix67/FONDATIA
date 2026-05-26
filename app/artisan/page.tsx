import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { CompanyStatus, MarketExecutionStatus, MarketStatus } from "@prisma/client"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { getCompanyStatusCopy } from "@/lib/company-status"

type ArtisanTab =
  | "overview"
  | "messages"
  | "market-search"
  | "active-markets"
  | "completed-markets"
  | "settings"

type ArtisanPageProps = {
  searchParams: Promise<{
    tab?: ArtisanTab
    q?: string
    city?: string
    activity?: string
    saved?: string
  }>
}

const artisanTabs: Array<{ id: ArtisanTab; label: string; eyebrow: string }> = [
  { id: "overview", label: "Vue d'ensemble", eyebrow: "Pilotage" },
  { id: "messages", label: "Messagerie", eyebrow: "Echanges" },
  { id: "market-search", label: "Marche en ligne", eyebrow: "Opportunites" },
  { id: "active-markets", label: "Marches en cours", eyebrow: "Production" },
  { id: "completed-markets", label: "Marches termines", eyebrow: "Historique" },
  { id: "settings", label: "Parametres", eyebrow: "Profil" },
]

const profileSettingsSchema = z.object({
  userName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(12),
  address: z.string().trim().min(5).max(180),
})

export default async function ArtisanPage({ searchParams }: ArtisanPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/artisan")
  }

  const role = (session.user as { role?: string }).role

  if (role !== "ARTISAN") {
    redirect("/acces-interdit")
  }

  const userId = String((session.user as { id?: string }).id ?? "")
  const company = await prisma.company.findUnique({
    where: { userId },
  })

  const params = await searchParams
  const selectedTab = artisanTabs.some((tab) => tab.id === params.tab)
    ? (params.tab as ArtisanTab)
    : "overview"
  const searchQuery = normalizeQuery(params.q)
  const cityQuery = normalizeQuery(params.city)
  const activityQuery = normalizeQuery(params.activity)
  const showSavedState = params.saved === "1"

  async function updateSettingsAction(formData: FormData) {
    "use server"

    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as { role?: string }).role !== "ARTISAN") {
      redirect("/login?callbackUrl=/artisan")
    }

    const parsed = profileSettingsSchema.safeParse({
      userName: String(formData.get("userName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      city: String(formData.get("city") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
      address: String(formData.get("address") ?? ""),
    })

    if (!parsed.success) {
      redirect("/artisan?tab=settings")
    }

    const sessionUserId = String((session.user as { id?: string }).id ?? "")

    await prisma.user.update({
      where: { id: sessionUserId },
      data: {
        name: parsed.data.userName,
      },
    })

    await prisma.company.update({
      where: { userId: sessionUserId },
      data: {
        phone: parsed.data.phone,
        city: parsed.data.city,
        postalCode: parsed.data.postalCode,
        address: parsed.data.address,
      },
    })

    revalidatePath("/artisan")
    redirect("/artisan?tab=settings&saved=1")
  }

  const fallbackStatus = (session.user as { companyStatus?: string }).companyStatus ?? "PENDING"
  const status = (company?.status ?? fallbackStatus) as CompanyStatus
  const statusCopy = getCompanyStatusCopy(status)

  const documentItems = [
    { label: "KBIS", ready: Boolean(company?.kbisUrl) },
    { label: "Assurance decennale", ready: Boolean(company?.insuranceDecennaleUrl) },
    { label: "Carte d'identite recto", ready: Boolean(company?.identityCardFrontUrl) },
    { label: "Carte d'identite verso", ready: Boolean(company?.identityCardBackUrl) },
  ]

  const completedDocuments = documentItems.filter((item) => item.ready).length
  const profileCompletion = getProfileCompletion({
    legalName: company?.legalName,
    phone: company?.phone,
    city: company?.city,
    postalCode: company?.postalCode,
    address: company?.address,
    kbisUrl: company?.kbisUrl,
    insuranceDecennaleUrl: company?.insuranceDecennaleUrl,
  })

  const marketWhere = {
    status: MarketStatus.LIVE,
    ...(company?.id ? { ownerCompanyId: { not: company.id } } : {}),
    ...(searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery, mode: "insensitive" as const } },
            { description: { contains: searchQuery, mode: "insensitive" as const } },
            { activity: { contains: searchQuery, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(cityQuery ? { city: { contains: cityQuery, mode: "insensitive" as const } } : {}),
    ...(activityQuery
      ? { activity: { contains: activityQuery, mode: "insensitive" as const } }
      : {}),
  }

  const [liveMarkets, liveMarketsCount, liveActivities, activeAssignedMarkets, completedAssignedMarkets] = await Promise.all([
    prisma.market.findMany({
      where: marketWhere,
      include: {
        ownerCompany: {
          select: {
            legalName: true,
            city: true,
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.market.count({
      where: {
        status: MarketStatus.LIVE,
        ...(company?.id ? { ownerCompanyId: { not: company.id } } : {}),
      },
    }),
    prisma.market.findMany({
      where: {
        status: MarketStatus.LIVE,
        ...(company?.id ? { ownerCompanyId: { not: company.id } } : {}),
      },
      select: { activity: true },
      distinct: ["activity"],
      orderBy: { activity: "asc" },
      take: 8,
    }),
    prisma.market.findMany({
      where: {
        assignedArtisanUserId: userId,
        executionStatus: MarketExecutionStatus.ASSIGNED,
      },
      include: {
        ownerCompany: {
          select: {
            legalName: true,
            city: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [{ assignedAt: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.market.findMany({
      where: {
        assignedArtisanUserId: userId,
        executionStatus: MarketExecutionStatus.COMPLETED,
      },
      include: {
        ownerCompany: {
          select: {
            legalName: true,
            city: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
    }),
  ])

  const nextSteps = getNextSteps(status, company?.rejectedReason)
  const inboxItems = buildInboxItems({
    status,
    rejectedReason: company?.rejectedReason,
    liveMarketCount: liveMarketsCount,
    activeAssignedCount: activeAssignedMarkets.length,
    completedAssignedCount: completedAssignedMarkets.length,
  })

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#050b16_38%,#020617_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[290px] lg:flex-none">
          <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="border-b border-white/10 pb-5">
              <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200/70">FONDATIA</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Dashboard artisan</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Un espace unique pour piloter votre dossier, explorer les opportunites et suivre vos marches reels.
              </p>
            </div>

            <nav className="mt-5 space-y-2">
              {artisanTabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tabHref(tab.id)}
                  className={[
                    "block rounded-[1.4rem] border px-4 py-3 transition",
                    selectedTab === tab.id
                      ? "border-sky-300/25 bg-sky-300/12 text-white"
                      : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{tab.eyebrow}</p>
                  <p className="mt-1 text-sm font-medium">{tab.label}</p>
                </Link>
              ))}
            </nav>

            <div className="mt-auto space-y-3 pt-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">A retenir</p>
                <p className="mt-2 text-sm text-white">{activeAssignedMarkets.length} marche(s) actuellement en cours</p>
                <p className="mt-1 text-sm text-slate-400">{completedAssignedMarkets.length} marche(s) deja termines</p>
              </div>

              <Link
                className="flex items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                href="/api/auth/signout?callbackUrl=/"
              >
                Se deconnecter
              </Link>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(8,47,73,0.66))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200/75">Espace partenaire</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {getHeaderTitle(selectedTab)}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {getHeaderDescription(selectedTab, statusCopy.title)}
                </p>
              </div>

              <div className="grid min-w-full gap-3 sm:grid-cols-4 xl:min-w-[720px]">
                <HeroMetric label="Statut dossier" value={statusLabel(status)} tone={statusTone(status)} />
                <HeroMetric label="Marches en cours" value={String(activeAssignedMarkets.length)} tone="sky" />
                <HeroMetric label="Marches termines" value={String(completedAssignedMarkets.length)} tone="emerald" />
                <HeroMetric label="Marches visibles" value={String(liveMarketsCount)} tone="amber" />
              </div>
            </div>
          </header>

          {selectedTab === "overview" ? (
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
              <GlassCard className="p-6 sm:p-8">
                <SectionHeading
                  eyebrow="Dossier"
                  title={statusCopy.title}
                  description={statusCopy.description}
                />

                <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-3">
                    <span className={`status-dot ${statusCopy.dotClass}`} />
                    <span className={`text-lg font-medium ${statusCopy.toneClass}`}>{statusLabel(status)}</span>
                  </div>
                  {company?.rejectedReason ? (
                    <div className="mt-4 rounded-[1.4rem] border border-rose-300/20 bg-rose-300/10 px-4 py-4">
                      <p className="text-sm text-rose-100">Motif communique</p>
                      <p className="mt-2 text-sm leading-7 text-rose-50">{company.rejectedReason}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricCard label="Entreprise" value={company?.legalName ?? "Non renseignee"} />
                  <MetricCard label="Marches actifs" value={String(activeAssignedMarkets.length)} />
                  <MetricCard label="Marches livres" value={String(completedAssignedMarkets.length)} />
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  <QuickLink
                    href={tabHref("messages")}
                    title="Messagerie"
                    description="Retrouver les notifications de dossier et le futur espace d'echange entre professionnels."
                  />
                  <QuickLink
                    href={tabHref("market-search")}
                    title="Marche en ligne"
                    description="Explorer les marches publies et filtrer les opportunites disponibles."
                  />
                  <QuickLink
                    href={tabHref("active-markets")}
                    title="Marches en cours"
                    description="Suivre les missions qui vous ont reellement ete attribuees par l'administration."
                  />
                </div>
              </GlassCard>

              <div className="space-y-6">
                <GlassCard className="p-6 sm:p-8">
                  <SectionHeading
                    eyebrow="Documents"
                    title="Pieces entreprise"
                    description="Une lecture simple de la completude du dossier pour eviter les points de friction pendant la validation."
                  />
                  <div className="mt-6 grid gap-3">
                    {documentItems.map((document) => (
                      <DocumentRow key={document.label} label={document.label} ready={document.ready} />
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <SectionHeading
                    eyebrow="Suite"
                    title="Prochaines etapes"
                    description="Le dashboard oriente l'artisan sur la marche suivante en fonction de l'etat reel du dossier."
                  />
                  <div className="mt-6 space-y-3">
                    {nextSteps.map((step) => (
                      <div key={step} className="rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-200">
                        {step}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : null}

          {selectedTab === "messages" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Echanges"
                title="Messagerie artisan"
                description="Cette vue centralise deja les notifications utiles. Le fil de discussion avec les autres professionnels est reserve ici et pourra etre branche sans refonte d'interface."
              />

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  {inboxItems.map((item) => (
                    <MessageCard key={item.id} item={item} />
                  ))}
                </div>

                <div className="space-y-4">
                  <InfoPanel
                    title="Echanges interprofessionnels"
                    description="Les conversations avec d'autres professionnels apparaitront ici des que le module de messagerie sera relie aux vrais modeles de conversation."
                    points={[
                      "historique des messages",
                      "priorite des demandes",
                      "contexte chantier et pieces partagees",
                    ]}
                  />
                  <InfoPanel
                    title="Bonnes pratiques"
                    description="Gardez votre profil, vos disponibilites et vos documents a jour pour fluidifier la prise de contact quand la messagerie sera activee."
                    points={[
                      "coordonnees fiables",
                      "profil complet",
                      "reponse rapide a l'equipe FONDATIA",
                    ]}
                  />
                </div>
              </div>
            </GlassCard>
          ) : null}

          {selectedTab === "market-search" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Opportunites"
                title="Recherche de marches en ligne"
                description="Les marches deja publies peuvent etre filtres ici pour reperer rapidement les opportunites pertinentes selon l'activite, la ville ou un mot cle."
              />

              <form className="mt-6 space-y-4 rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
                <input type="hidden" name="tab" value="market-search" />
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.9fr_auto]">
                  <FormInput name="q" defaultValue={searchQuery} placeholder="Recherche par mot cle" />
                  <FormInput name="city" defaultValue={cityQuery} placeholder="Ville" />
                  <FormInput name="activity" defaultValue={activityQuery} placeholder="Activite" />
                  <button
                    type="submit"
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    Rechercher
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                  {liveActivities.map((activity) => (
                    <Link
                      key={activity.activity}
                      href={`/artisan?tab=market-search&activity=${encodeURIComponent(activity.activity)}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 hover:text-white"
                    >
                      {activity.activity}
                    </Link>
                  ))}
                </div>
              </form>

              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-300">
                  {liveMarkets.length} marche(s) affiches sur {liveMarketsCount} disponible(s)
                </p>
                {searchQuery || cityQuery || activityQuery ? (
                  <Link
                    href="/artisan?tab=market-search"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    Reinitialiser les filtres
                  </Link>
                ) : null}
              </div>

              {liveMarkets.length === 0 ? (
                <EmptyState
                  title="Aucun marche ne correspond a la recherche"
                  description="Ajustez les filtres ou revenez plus tard. Les nouvelles opportunites publiees apparaitront ici automatiquement."
                />
              ) : (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {liveMarkets.map((market) => (
                    <MarketOpportunityCard key={market.id} market={market} />
                  ))}
                </div>
              )}
            </GlassCard>
          ) : null}

          {selectedTab === "active-markets" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Production"
                title="Marches en cours"
                description="Ces marches vous ont ete reellement attribues par l'administration. Vous retrouvez ici le contexte, le contact donneur et le cadre d'execution."
              />
              {activeAssignedMarkets.length === 0 ? (
                <EmptyState
                  title="Aucun marche en cours pour le moment"
                  description="Cette zone affichera automatiquement les marches attribues des qu'un admin vous positionne sur une mission."
                />
              ) : (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {activeAssignedMarkets.map((market) => (
                    <AssignedMarketCard key={market.id} market={market} mode="active" />
                  ))}
                </div>
              )}
            </GlassCard>
          ) : null}

          {selectedTab === "completed-markets" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Historique"
                title="Marches termines"
                description="Les marches clotures construisent votre historique d'execution et pourront servir de base de credibilite pour la suite produit."
              />
              {completedAssignedMarkets.length === 0 ? (
                <EmptyState
                  title="Aucun marche termine enregistre"
                  description="Une fois les premiers marches finalises, cette vue servira de portefeuille de references et de preuve de fiabilite pour l'artisan."
                />
              ) : (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {completedAssignedMarkets.map((market) => (
                    <AssignedMarketCard key={market.id} market={market} mode="completed" />
                  ))}
                </div>
              )}
            </GlassCard>
          ) : null}

          {selectedTab === "settings" ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <GlassCard className="p-6 sm:p-8">
                <SectionHeading
                  eyebrow="Profil"
                  title="Parametres du compte artisan"
                  description="Les coordonnees modifiables sont centralisees ici pour garder un profil a jour sans toucher aux informations sensibles d'authentification."
                />

                {showSavedState ? (
                  <div className="mt-6 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 px-4 py-4 text-sm text-emerald-50">
                    Vos parametres ont ete mis a jour.
                  </div>
                ) : null}

                <form action={updateSettingsAction} className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Contact principal">
                      <input
                        name="userName"
                        defaultValue={session.user.name ?? ""}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
                      />
                    </FieldBlock>
                    <FieldBlock label="Telephone">
                      <input
                        name="phone"
                        defaultValue={company?.phone ?? ""}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
                      />
                    </FieldBlock>
                    <FieldBlock label="Ville">
                      <input
                        name="city"
                        defaultValue={company?.city ?? ""}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
                      />
                    </FieldBlock>
                    <FieldBlock label="Code postal">
                      <input
                        name="postalCode"
                        defaultValue={company?.postalCode ?? ""}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
                      />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Adresse">
                    <textarea
                      name="address"
                      rows={4}
                      defaultValue={company?.address ?? ""}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
                    />
                  </FieldBlock>

                  <button
                    type="submit"
                    className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    Enregistrer les parametres
                  </button>
                </form>
              </GlassCard>

              <div className="space-y-6">
                <GlassCard className="p-6 sm:p-8">
                  <SectionHeading
                    eyebrow="Lecture"
                    title="Informations sensibles en lecture seule"
                    description="Ces informations restent visibles mais ne sont pas exposees a une edition libre pour eviter de casser l'authentification ou la conformite dossier."
                  />
                  <div className="mt-6 grid gap-3">
                    <ReadonlyRow label="Raison sociale" value={company?.legalName ?? "Non renseignee"} />
                    <ReadonlyRow label="Email de connexion" value={session.user.email ?? "Non renseigne"} />
                    <ReadonlyRow label="Email entreprise" value={company?.email ?? "Non renseigne"} />
                    <ReadonlyRow label="SIREN" value={company?.siren ?? "Non renseigne"} />
                    <ReadonlyRow label="SIRET" value={company?.siret ?? "Non renseigne"} />
                  </div>
                </GlassCard>

                <GlassCard className="p-6 sm:p-8">
                  <SectionHeading
                    eyebrow="Utilite"
                    title="Autres reglages utiles"
                    description="Le dashboard met aussi en avant les points pratiques qui faciliteront la suite produit cote artisan."
                  />
                  <div className="mt-6 space-y-3">
                    <UtilityRow
                      title="Completude du profil"
                      value={`${profileCompletion}%`}
                      detail="Un profil plus complet sera plus simple a mobiliser dans les futures mises en relation."
                    />
                    <UtilityRow
                      title="Etat des documents"
                      value={`${completedDocuments}/4`}
                      detail="Le suivi des justificatifs reste visible ici avant le branchement complet de l'upload Storage."
                    />
                    <UtilityRow
                      title="Marches suivis"
                      value={`${activeAssignedMarkets.length + completedAssignedMarkets.length}`}
                      detail="Le compteur se nourrit maintenant des affectations reelles faites par l'administration."
                    />
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function HeroMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "default" | "sky" | "amber" | "emerald" | "rose"
}) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white",
    sky: "border-sky-300/20 bg-sky-300/10 text-sky-50",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-50",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-50",
    rose: "border-rose-300/20 bg-rose-300/10 text-rose-50",
  }

  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
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

function QuickLink({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 transition hover:bg-white/5"
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </Link>
  )
}

function DocumentRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-[1.35rem] border px-4 py-4",
        ready
          ? "border-emerald-300/15 bg-emerald-300/10 text-emerald-50"
          : "border-white/10 bg-black/20 text-slate-200",
      ].join(" ")}
    >
      <span className="text-sm">{label}</span>
      <span className="text-sm font-medium">{ready ? "Document recu" : "Document manquant"}</span>
    </div>
  )
}

function MessageCard({
  item,
}: {
  item: {
    id: string
    category: string
    title: string
    preview: string
    status: string
    tone: "default" | "sky" | "amber" | "emerald" | "rose"
  }
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.category}</p>
        <Badge tone={item.tone}>{item.status}</Badge>
      </div>
      <h4 className="mt-3 text-lg font-semibold text-white">{item.title}</h4>
      <p className="mt-3 text-sm leading-7 text-slate-300">{item.preview}</p>
    </div>
  )
}

function MarketOpportunityCard({
  market,
}: {
  market: {
    id: string
    title: string
    description: string
    activity: string
    city: string
    postalCode: string
    budgetMin: number | null
    budgetMax: number | null
    timeframe: string | null
    publishedAt: Date | null
    ownerCompany: {
      legalName: string
      city: string
    }
  }
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="text-lg font-semibold text-white">{market.title}</h4>
        <Badge tone="emerald">En ligne</Badge>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{market.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MutedPanel label="Activite" value={market.activity} />
        <MutedPanel label="Zone" value={`${market.city} (${market.postalCode})`} />
        <MutedPanel label="Budget" value={formatBudget(market.budgetMin, market.budgetMax)} />
        <MutedPanel label="Delai" value={market.timeframe ?? "A preciser"} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span>Diffuse par {market.ownerCompany.legalName}</span>
        <span className="text-slate-500">•</span>
        <span>{market.publishedAt ? `Publie le ${formatDate(market.publishedAt)}` : "Publication recente"}</span>
      </div>
    </div>
  )
}

function AssignedMarketCard({
  market,
  mode,
}: {
  market: {
    id: string
    title: string
    description: string
    activity: string
    city: string
    postalCode: string
    budgetMin: number | null
    budgetMax: number | null
    timeframe: string | null
    assignedAt: Date | null
    completedAt: Date | null
    ownerCompany: {
      legalName: string
      city: string
      phone: string
      email: string
    }
  }
  mode: "active" | "completed"
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="text-lg font-semibold text-white">{market.title}</h4>
        <Badge tone={mode === "active" ? "sky" : "emerald"}>{mode === "active" ? "En cours" : "Termine"}</Badge>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{market.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MutedPanel label="Activite" value={market.activity} />
        <MutedPanel label="Zone" value={`${market.city} (${market.postalCode})`} />
        <MutedPanel label="Budget" value={formatBudget(market.budgetMin, market.budgetMax)} />
        <MutedPanel label="Delai" value={market.timeframe ?? "A preciser"} />
        <MutedPanel label="Donneur" value={market.ownerCompany.legalName} />
        <MutedPanel label="Contact" value={`${market.ownerCompany.phone} • ${market.ownerCompany.email}`} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span>{market.assignedAt ? `Attribue le ${formatDate(market.assignedAt)}` : "Attribution recente"}</span>
        {mode === "completed" && market.completedAt ? (
          <>
            <span className="text-slate-500">•</span>
            <span>Termine le {formatDate(market.completedAt)}</span>
          </>
        ) : null}
      </div>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-[1.7rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-6">
      <p className="text-base font-medium text-white">{title}</p>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      {children}
    </label>
  )
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function UtilityRow({
  title,
  value,
  detail,
}: {
  title: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-white">{title}</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
          {value}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{detail}</p>
    </div>
  )
}

function InfoPanel({
  title,
  description,
  points,
}: {
  title: string
  description: string
  points: string[]
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <div className="mt-4 space-y-2">
        {points.map((point) => (
          <div key={point} className="rounded-[1.2rem] border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
            {point}
          </div>
        ))}
      </div>
    </div>
  )
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: "default" | "sky" | "amber" | "emerald" | "rose"
}) {
  const tones = {
    default: "border-white/10 bg-white/5 text-slate-200",
    sky: "border-sky-300/20 bg-sky-300/10 text-sky-50",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-50",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-50",
    rose: "border-rose-300/20 bg-rose-300/10 text-rose-50",
  }

  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

function FormInput({
  name,
  defaultValue,
  placeholder,
}: {
  name: string
  defaultValue: string
  placeholder: string
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-sky-300/60"
    />
  )
}

function MutedPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}

function getHeaderTitle(tab: ArtisanTab) {
  switch (tab) {
    case "overview":
      return "Votre cockpit artisan FONDATIA"
    case "messages":
      return "Messagerie et suivi des echanges"
    case "market-search":
      return "Recherche de marches publies"
    case "active-markets":
      return "Suivi des marches actuellement en production"
    case "completed-markets":
      return "Historique des marches termines"
    case "settings":
      return "Parametres et profil entreprise"
  }
}

function getHeaderDescription(tab: ArtisanTab, statusTitle: string) {
  switch (tab) {
    case "overview":
      return "Une vue claire pour suivre le dossier, verifier la completude des pieces et garder une lecture directe de votre situation sur la plateforme."
    case "messages":
      return "Les notifications utiles sont deja centralisees ici, avec une place prete pour les futures conversations entre professionnels sans changer l'experience artisan."
    case "market-search":
      return "Parcourez les marches actuellement publies par la plateforme et affinez la recherche sans quitter votre espace artisan."
    case "active-markets":
      return "La vue est maintenant alimentee par de vraies attributions admin. Vous y retrouvez les missions actuellement en execution."
    case "completed-markets":
      return "L'historique des marches termines se construit maintenant sur des donnees d'execution reelles."
    case "settings":
      return `Les parametres mettent a jour les coordonnees utiles sans toucher aux elements sensibles. Statut actuel : ${statusTitle}.`
  }
}

function getNextSteps(status: CompanyStatus, rejectedReason?: string | null) {
  if (status === "APPROVED") {
    return [
      "Votre profil est mobilisable pour la suite produit et les futurs flux de mise en relation qualifies.",
      "Gardez vos coordonnees, votre ville d'intervention et vos justificatifs a jour pour accelerer les prises de contact.",
      "Consultez regulierement les marches en ligne et suivez vos missions attribuees depuis les onglets dedies.",
    ]
  }

  if (status === "REJECTED") {
    return [
      rejectedReason
        ? `Corriger en priorite : ${rejectedReason}`
        : "Un refus a ete enregistre et peut demander une relecture plus complete du dossier.",
      "Mettez a jour les informations de profil avant toute nouvelle presentation du dossier.",
      "Verifiez que les documents obligatoires sont lisibles et coherents.",
    ]
  }

  if (status === "BLOCKED") {
    return [
      "Le compte est actuellement suspendu ou bloque et ne peut pas etre mobilise sur la plateforme.",
      "Conservez vos informations a jour pendant la revue interne par l'equipe FONDATIA.",
      "La lecture du dossier reste disponible ici pour garder une trace claire de la situation.",
    ]
  }

  return [
    "Votre dossier est en cours d'etude par l'equipe FONDATIA.",
    "Assurez-vous que les informations de contact et les pieces obligatoires sont bien completes.",
    "Le statut evoluera automatiquement ici des qu'une decision admin sera prise.",
  ]
}

function buildInboxItems({
  status,
  rejectedReason,
  liveMarketCount,
  activeAssignedCount,
  completedAssignedCount,
}: {
  status: CompanyStatus
  rejectedReason?: string | null
  liveMarketCount: number
  activeAssignedCount: number
  completedAssignedCount: number
}) {
  return [
    {
      id: "message-1",
      category: "Notification dossier",
      title: `Etat du dossier : ${statusLabel(status)}`,
      preview:
        status === "REJECTED" && rejectedReason
          ? `Le dossier demande une correction. Motif actuel : ${rejectedReason}`
          : "Le tableau de bord conserve une lecture claire du statut de votre dossier et des prochaines actions utiles.",
      status: statusLabel(status),
      tone: statusTone(status),
    },
    {
      id: "message-2",
      category: "Veille marche",
      title: `${liveMarketCount} marche(s) sont actuellement publies`,
      preview:
        "L'onglet Marche en ligne vous permet deja d'explorer les opportunites visibles sur la plateforme avec des filtres simples.",
      status: "A consulter",
      tone: "amber",
    },
    {
      id: "message-3",
      category: "Execution",
      title: `${activeAssignedCount} marche(s) en cours • ${completedAssignedCount} termine(s)`,
      preview:
        "Les affectations reelles admin alimentent maintenant les vues de production et d'historique dans votre dashboard.",
      status: "Reel",
      tone: "sky",
    },
  ]
}

function getProfileCompletion(values: Record<string, string | null | undefined>) {
  const filled = Object.values(values).filter((value) => Boolean(value)).length
  return Math.round((filled / Object.keys(values).length) * 100)
}

function statusLabel(status: CompanyStatus) {
  switch (status) {
    case "PENDING":
      return "En attente"
    case "APPROVED":
      return "Approuve"
    case "REJECTED":
      return "Refuse"
    case "BLOCKED":
      return "Bloque"
  }
}

function statusTone(status: CompanyStatus): "amber" | "emerald" | "rose" | "default" {
  switch (status) {
    case "PENDING":
      return "amber"
    case "APPROVED":
      return "emerald"
    case "REJECTED":
      return "rose"
    case "BLOCKED":
      return "default"
  }
}

function tabHref(tab: ArtisanTab) {
  return tab === "overview" ? "/artisan" : `/artisan?tab=${tab}`
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value)
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

function normalizeQuery(value?: string) {
  return value?.trim() ?? ""
}
