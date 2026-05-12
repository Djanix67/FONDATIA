import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { CompanyStatusActions } from "@/components/admin/company-status-actions"
import { marketAdminStatusSchema } from "@/lib/validations/artisan-register"

type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED"
type MarketStatus = "PENDING_REVIEW" | "LIVE" | "REJECTED" | "ARCHIVED"
type AdminTab =
  | "overview"
  | "dossiers"
  | "moderation"
  | "mailbox"
  | "artisans-online"
  | "markets-live"
  | "markets-review"

type AdminPageProps = {
  searchParams: Promise<{
    status?: CompanyStatus
    tab?: AdminTab
  }>
}

type CompanyWithUser = Awaited<ReturnType<typeof getArtisanCompanies>>[number]
type DonorCompany = Awaited<ReturnType<typeof getDonorCompanies>>[number]
type MarketWithOwner = Awaited<ReturnType<typeof getMarketsByStatus>>[number]

const tabs: Array<{ id: AdminTab; label: string; eyebrow: string }> = [
  { id: "overview", label: "Vue d'ensemble", eyebrow: "Synthese" },
  { id: "dossiers", label: "Dossiers artisans", eyebrow: "Validation" },
  { id: "moderation", label: "Messages clients", eyebrow: "Controle" },
  { id: "mailbox", label: "Boite admin", eyebrow: "Messagerie" },
  { id: "artisans-online", label: "Artisans en ligne", eyebrow: "Disponibilite" },
  { id: "markets-live", label: "Marches en ligne", eyebrow: "Diffusion" },
  { id: "markets-review", label: "Marches a valider", eyebrow: "Publication" },
]

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }

  const role = (session.user as { role?: string }).role

  if (role !== "ADMIN") {
    redirect("/acces-interdit")
  }

  async function updateMarketStatusAction(formData: FormData) {
    "use server"

    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      redirect("/login?callbackUrl=/admin")
    }

    const marketId = String(formData.get("marketId") ?? "")

    if (!marketId) {
      return
    }

    const parsed = marketAdminStatusSchema.safeParse({
      status: String(formData.get("status") ?? ""),
      adminNotes: normalizeString(formData.get("adminNotes")),
      rejectionReason: normalizeString(formData.get("rejectionReason")),
    })

    if (!parsed.success) {
      revalidatePath("/admin")
      return
    }

    const existingMarket = await prisma.market.findUnique({
      where: { id: marketId },
      select: { publishedAt: true },
    })

    if (!existingMarket) {
      revalidatePath("/admin")
      return
    }

    const nextStatus = parsed.data.status as MarketStatus

    await prisma.market.update({
      where: { id: marketId },
      data: {
        status: nextStatus,
        adminNotes: parsed.data.adminNotes ?? null,
        rejectionReason: nextStatus === "REJECTED" ? parsed.data.rejectionReason ?? null : null,
        publishedAt:
          nextStatus === "LIVE"
            ? existingMarket.publishedAt ?? new Date()
            : nextStatus === "PENDING_REVIEW"
              ? null
              : existingMarket.publishedAt,
      },
    })

    revalidatePath("/admin")
    revalidatePath("/donneur-ordre")
  }

  const params = await searchParams
  const selectedStatus = params.status
  const selectedTab = tabs.some((tab) => tab.id === params.tab) ? (params.tab as AdminTab) : "overview"

  const [
    artisanCompanies,
    recentApprovedArtisans,
    donorCompanies,
    artisanTotal,
    pendingCount,
    approvedCount,
    rejectedCount,
    blockedCount,
    donorCount,
    liveMarkets,
    reviewMarkets,
    rejectedMarkets,
    marketTotal,
  ] = await Promise.all([
    getArtisanCompanies(selectedStatus),
    prisma.company.findMany({
      where: {
        user: { role: "ARTISAN" },
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    getDonorCompanies(),
    prisma.company.count({ where: { user: { role: "ARTISAN" } } }),
    prisma.company.count({ where: { user: { role: "ARTISAN" }, status: "PENDING" } }),
    prisma.company.count({ where: { user: { role: "ARTISAN" }, status: "APPROVED" } }),
    prisma.company.count({ where: { user: { role: "ARTISAN" }, status: "REJECTED" } }),
    prisma.company.count({ where: { user: { role: "ARTISAN" }, status: "BLOCKED" } }),
    prisma.user.count({ where: { role: "DONNEUR" } }),
    getMarketsByStatus("LIVE"),
    getMarketsByStatus("PENDING_REVIEW"),
    getMarketsByStatus("REJECTED"),
    prisma.market.count(),
  ])

  const moderationThreads = buildModerationThreads(artisanCompanies, donorCompanies)
  const mailboxItems = buildMailboxItems({
    pendingCount,
    approvedCount,
    rejectedCount,
    donorCount,
    moderationCount: moderationThreads.length,
    liveMarketCount: liveMarkets.length,
    reviewMarketCount: reviewMarkets.length,
  })
  const onlineArtisans = buildOnlineArtisans(recentApprovedArtisans)
  const latestArtisans = artisanCompanies.slice(0, 4)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_22%),linear-gradient(180deg,#020617_0%,#040b16_38%,#020617_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[290px] lg:flex-none">
          <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="border-b border-white/10 pb-5">
              <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200/70">FONDATIA</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Console admin</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Un poste de pilotage unique pour moderer, valider et suivre l'activite de la plateforme.
              </p>
            </div>

            <nav className="mt-5 space-y-2">
              {tabs.map((tab) => {
                const active = selectedTab === tab.id
                return (
                  <Link
                    key={tab.id}
                    href={tabHref(tab.id, selectedStatus)}
                    className={[
                      "block rounded-[1.4rem] border px-4 py-3 transition",
                      active
                        ? "border-sky-300/25 bg-sky-300/12 text-white"
                        : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{tab.eyebrow}</p>
                    <p className="mt-1 text-sm font-medium">{tab.label}</p>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto space-y-3 pt-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Aujourd'hui</p>
                <p className="mt-2 text-sm text-white">{pendingCount} dossiers attendent une decision</p>
                <p className="mt-1 text-sm text-slate-400">{reviewMarkets.length} marches sont prets pour validation</p>
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
                <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200/75">Back office premium</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {getHeaderTitle(selectedTab)}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {getHeaderDescription(selectedTab)}
                </p>
              </div>

              <div className="grid min-w-full gap-3 sm:grid-cols-4 xl:min-w-[700px]">
                <HeroMetric label="Artisans suivis" value={artisanTotal} tone="default" />
                <HeroMetric label="Donneurs actifs" value={donorCount} tone="sky" />
                <HeroMetric label="Marches ouverts" value={liveMarkets.length} tone="emerald" />
                <HeroMetric label="Marches a relire" value={reviewMarkets.length} tone="amber" />
              </div>
            </div>
          </header>

          <section className="grid gap-3 xl:grid-cols-6">
            <KpiTile label="Dossiers en attente" value={pendingCount} hint="Validation artisan" accent="amber" />
            <KpiTile label="Profils approuves" value={approvedCount} hint="Artisans visibles" accent="emerald" />
            <KpiTile label="Profils refuses" value={rejectedCount} hint="A historiser" accent="rose" />
            <KpiTile label="Profils bloques" value={blockedCount} hint="Acces suspendus" accent="slate" />
            <KpiTile label="Marches en ligne" value={liveMarkets.length} hint="Diffusion active" accent="emerald" />
            <KpiTile label="Marches total" value={marketTotal} hint="Demandes cumulees" accent="sky" />
          </section>

          {selectedTab === "overview" ? (
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <GlassCard className="p-6 sm:p-8">
                <SectionHeading
                  eyebrow="Synthese"
                  title="Priorites operationnelles"
                  description="Les points les plus sensibles du jour sont regroupes ici pour limiter les changements de contexte."
                />
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <PriorityPanel
                    title="Validation artisan"
                    value={`${pendingCount} dossiers`}
                    description="Controle des pieces et decisions de statut a traiter sans attente inutile."
                  />
                  <PriorityPanel
                    title="Moderation messages"
                    value={`${moderationThreads.length} fils`}
                    description="Surveillance des echanges sensibles entre donneurs d'ordre et artisans."
                  />
                  <PriorityPanel
                    title="Publication marches"
                    value={`${reviewMarkets.length} annonces`}
                    description="Derniere lecture avant diffusion publique des demandes."
                  />
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <BandPanel title="Derniers dossiers" eyebrow="Flux entrant">
                    <div className="space-y-3">
                      {latestArtisans.length === 0 ? (
                        <EmptyInline text="Aucun dossier artisan disponible pour le moment." />
                      ) : (
                        latestArtisans.map((company) => (
                          <RowLine
                            key={company.id}
                            title={company.legalName}
                            subtitle={`${company.city} • ${company.user.name}`}
                            meta={statusLabel(company.status as CompanyStatus)}
                          />
                        ))
                      )}
                    </div>
                  </BandPanel>

                  <BandPanel title="Marches a arbitrer" eyebrow="Publication">
                    <div className="space-y-3">
                      {reviewMarkets.length === 0 ? (
                        <EmptyInline text="Aucun marche en attente de validation pour le moment." />
                      ) : (
                        reviewMarkets.slice(0, 4).map((market) => (
                          <RowLine
                            key={market.id}
                            title={market.title}
                            subtitle={`${market.ownerCompany.legalName} • ${market.city}`}
                            meta={marketStatusLabel(market.status as MarketStatus)}
                          />
                        ))
                      )}
                    </div>
                  </BandPanel>
                </div>
              </GlassCard>

              <GlassCard className="p-6 sm:p-8">
                <SectionHeading
                  eyebrow="Vue rapide"
                  title="Activite en direct"
                  description="Une lecture rapide de l'ecosysteme pour orienter les prochaines decisions admin."
                />
                <div className="mt-6 space-y-4">
                  <SignalCard
                    label="Artisans en ligne"
                    value={onlineArtisans.length}
                    detail="Profils approuves actuellement exposes dans le suivi admin."
                  />
                  <SignalCard
                    label="Marches visibles"
                    value={liveMarkets.length}
                    detail="Demandes diffusees et pretes pour la mise en relation qualifiee."
                  />
                  <SignalCard
                    label="Marches refuses"
                    value={rejectedMarkets.length}
                    detail="Demandes renvoyees au donneur pour amelioration ou clarification."
                  />
                </div>
              </GlassCard>
            </div>
          ) : null}

          {selectedTab === "dossiers" ? (
            <section className="space-y-5">
              <div className="flex flex-wrap gap-3 text-sm">
                <FilterLink href={tabHref("dossiers")} active={!selectedStatus}>
                  Tous
                </FilterLink>
                <FilterLink href={tabHref("dossiers", "PENDING")} active={selectedStatus === "PENDING"}>
                  En attente
                </FilterLink>
                <FilterLink href={tabHref("dossiers", "APPROVED")} active={selectedStatus === "APPROVED"}>
                  Approuves
                </FilterLink>
                <FilterLink href={tabHref("dossiers", "REJECTED")} active={selectedStatus === "REJECTED"}>
                  Refuses
                </FilterLink>
                <FilterLink href={tabHref("dossiers", "BLOCKED")} active={selectedStatus === "BLOCKED"}>
                  Bloques
                </FilterLink>
              </div>

              {artisanCompanies.length === 0 ? (
                <GlassCard className="p-8">
                  <p className="text-base text-slate-300">Aucun dossier ne correspond au filtre en cours.</p>
                </GlassCard>
              ) : (
                <div className="space-y-5">
                  {artisanCompanies.map((company) => (
                    <DossierCard key={company.id} company={company} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {selectedTab === "moderation" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Controle"
                title="Surveillance des messages echanges"
                description="Cette vue prepare le futur module de moderation. Elle permet deja de cadrer les niveaux d'alerte, les conversations sensibles et les actions attendues."
              />
              <div className="mt-6 space-y-4">
                {moderationThreads.map((thread) => (
                  <ConversationCard key={thread.id} thread={thread} />
                ))}
              </div>
            </GlassCard>
          ) : null}

          {selectedTab === "mailbox" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Messagerie"
                title="Boite de messagerie admin"
                description="Un espace unique pour les emails systeme, demandes prioritaires et relances internes a traiter dans la journee."
              />
              <div className="mt-6 space-y-3">
                {mailboxItems.map((item) => (
                  <MailboxRow key={item.id} item={item} />
                ))}
              </div>
            </GlassCard>
          ) : null}

          {selectedTab === "artisans-online" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Disponibilite"
                title="Artisans en ligne"
                description="Profils approuves mis en avant dans le suivi admin pour visualiser rapidement la capacite mobilisable."
              />
              <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {onlineArtisans.map((artisan) => (
                  <PresenceCard key={artisan.id} artisan={artisan} />
                ))}
              </div>
            </GlassCard>
          ) : null}

          {selectedTab === "markets-live" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Diffusion"
                title="Marches en ligne"
                description="Les marches ci-dessous sont reels. Ils proviennent des depots donneur et ont deja ete approuves pour diffusion."
              />
              {liveMarkets.length === 0 ? (
                <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-black/20 px-5 py-5 text-sm text-slate-300">
                  Aucun marche n'est en ligne pour le moment.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {liveMarkets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      mode="live"
                      action={updateMarketStatusAction}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          ) : null}

          {selectedTab === "markets-review" ? (
            <GlassCard className="p-6 sm:p-8">
              <SectionHeading
                eyebrow="Publication"
                title="Marches a valider avant mise en ligne"
                description="Ce sas editorial est maintenant branche sur les vraies demandes donneur. L'admin peut approuver, refuser ou archiver chaque marche."
              />
              {reviewMarkets.length === 0 ? (
                <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-black/20 px-5 py-5 text-sm text-slate-300">
                  Aucun marche n'attend de validation pour le moment.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {reviewMarkets.map((market) => (
                    <MarketCard
                      key={market.id}
                      market={market}
                      mode="review"
                      action={updateMarketStatusAction}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          ) : null}
        </section>
      </div>
    </main>
  )
}

async function getArtisanCompanies(status?: CompanyStatus) {
  return prisma.company.findMany({
    where: {
      user: { role: "ARTISAN" },
      ...(status ? { status } : {}),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })
}

async function getDonorCompanies() {
  return prisma.company.findMany({
    where: {
      user: { role: "DONNEUR" },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  })
}

async function getMarketsByStatus(status: MarketStatus) {
  return prisma.market.findMany({
    where: { status },
    include: {
      ownerCompany: {
        select: {
          legalName: true,
          city: true,
          email: true,
          phone: true,
        },
      },
      ownerUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  })
}

function getHeaderTitle(tab: AdminTab) {
  switch (tab) {
    case "overview":
      return "Vision globale du back office FONDATIA"
    case "dossiers":
      return "Validation et arbitrage des dossiers artisans"
    case "moderation":
      return "Controle des echanges entre clients et artisans"
    case "mailbox":
      return "Messagerie admin et priorites internes"
    case "artisans-online":
      return "Lecture instantanee de la disponibilite artisan"
    case "markets-live":
      return "Supervision des marches actuellement visibles"
    case "markets-review":
      return "File de validation avant mise en ligne des marches"
  }
}

function getHeaderDescription(tab: AdminTab) {
  switch (tab) {
    case "overview":
      return "Une lecture dense mais sereine des operations pour garder la main sur les validations, les conversations sensibles et la qualite de diffusion du produit."
    case "dossiers":
      return "Le coeur du MVP reste ici : lecture des pieces, verification de la solidite des profils et changement de statut avec impact direct sur l'experience artisan."
    case "moderation":
      return "Ce module cadre les futurs controles de conversations pour garder une plateforme premium, polie et protectrice pour les deux parties."
    case "mailbox":
      return "Toutes les alertes, relances et signaux critiques peuvent converger dans cette boite unique pour eviter la dispersion."
    case "artisans-online":
      return "Une vue rapide pour savoir quels profils mobilisables peuvent etre valorises dans le matching et le suivi des demandes."
    case "markets-live":
      return "L'admin garde un oeil sur les opportunites diffusees, leur niveau d'urgence et la qualite de leur presentation."
    case "markets-review":
      return "Avant publication, chaque marche peut etre relu comme un contenu premium, clair, rassurant et utile pour les artisans."
  }
}

function buildModerationThreads(artisanCompanies: CompanyWithUser[], donorCompanies: DonorCompany[]) {
  const artisanPool = artisanCompanies.slice(0, 3)
  const donorPool = donorCompanies.slice(0, 3)

  const generated = donorPool.flatMap((donor, donorIndex) => {
    return artisanPool.slice(0, 2).map((artisan, artisanIndex) => {
      const flagIndex = (donorIndex + artisanIndex) % 3
      const flags = [
        {
          level: "A surveiller",
          reason: "Demande de coordonnees directes apres un premier echange.",
          action: "Verifier qu'aucun contournement manifeste n'est en cours.",
        },
        {
          level: "Sain",
          reason: "Conversation logistique sans element de risque immediat.",
          action: "Aucune action urgente, simple suivi qualitatif.",
        },
        {
          level: "Prioritaire",
          reason: "Le client relance fortement sur les delais et le budget.",
          action: "Lecture admin recommandee avant escalation commerciale.",
        },
      ] as const

      const selected = flags[flagIndex]

      return {
        id: `${donor.id}-${artisan.id}`,
        counterpartA: donor.legalName,
        counterpartB: artisan.legalName,
        excerpt:
          donorIndex % 2 === 0
            ? "Bonjour, j'aimerais confirmer le perimetre des travaux avant de lancer le chantier."
            : "Pouvez-vous partager un planning precis et les contraintes d'intervention sur site ?",
        lastActivity: relativeLabel(artisanIndex + donorIndex + 1),
        level: selected.level,
        reason: selected.reason,
        action: selected.action,
      }
    })
  })

  if (generated.length > 0) {
    return generated
  }

  return [
    {
      id: "seed-thread-1",
      counterpartA: "Client prioritaire",
      counterpartB: "Artisan premium",
      excerpt: "Echange a controler des que le module conversation sera branche aux donnees reelles.",
      lastActivity: "Maintenant",
      level: "A preparer",
      reason: "Le poste de moderation est pret mais attend les futurs flux messages.",
      action: "Brancher le futur modele de conversations pour activer ce controle.",
    },
  ]
}

function buildMailboxItems({
  pendingCount,
  approvedCount,
  rejectedCount,
  donorCount,
  moderationCount,
  liveMarketCount,
  reviewMarketCount,
}: {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  donorCount: number
  moderationCount: number
  liveMarketCount: number
  reviewMarketCount: number
}) {
  return [
    {
      id: "mailbox-1",
      subject: "Dossiers artisans en attente de validation",
      preview: `${pendingCount} profil(s) necessitent une decision pour garder un delai de traitement premium.`,
      badge: "A traiter",
      tone: "amber",
    },
    {
      id: "mailbox-2",
      subject: "Messages a surveiller entre clients et artisans",
      preview: `${moderationCount} conversation(s) meritent une relecture rapide dans le futur module de moderation.`,
      badge: "Controle",
      tone: "sky",
    },
    {
      id: "mailbox-3",
      subject: "Marches en attente de publication",
      preview: `${reviewMarketCount} marche(s) attendent une validation avant diffusion au reseau artisan.`,
      badge: "Publication",
      tone: "amber",
    },
    {
      id: "mailbox-4",
      subject: "Marches actuellement en ligne",
      preview: `${liveMarketCount} marche(s) sont deja visibles et alimentent la suite produit cote donneur d'ordre.`,
      badge: "Diffuse",
      tone: "emerald",
    },
    {
      id: "mailbox-5",
      subject: "Profils donneurs d'ordre recemment actifs",
      preview: `${donorCount} compte(s) donneur sont presents dans la base actuelle et peuvent nourrir les prochains flux.`,
      badge: "Veille",
      tone: "default",
    },
    {
      id: "mailbox-6",
      subject: "Historique des dossiers refuses",
      preview: `${rejectedCount} dossier(s) sont refuses et peuvent demander une relance ou une revue qualitative.`,
      badge: "Archive",
      tone: "rose",
    },
    {
      id: "mailbox-7",
      subject: "Profils approuves disponibles",
      preview: `${approvedCount} artisan(s) sont deja valides et peuvent etre mis en avant dans les futurs matchings.`,
      badge: "OK",
      tone: "emerald",
    },
  ]
}

function buildOnlineArtisans(companies: CompanyWithUser[]) {
  const availability = [
    { status: "Disponible", detail: "Peut repondre aujourd'hui", tone: "emerald" },
    { status: "En mission", detail: "Chargee mais repond rapidement", tone: "sky" },
    { status: "A relancer", detail: "Derniere activite a confirmer", tone: "amber" },
  ] as const

  const generated = companies.map((company, index) => {
    const selected = availability[index % availability.length]

    return {
      id: company.id,
      name: company.legalName,
      contact: company.user.name,
      city: company.city,
      specialty: buildSpecialty(company),
      status: selected.status,
      detail: selected.detail,
      tone: selected.tone,
      verified: Boolean(company.user.emailVerified),
    }
  })

  if (generated.length > 0) {
    return generated
  }

  return [
    {
      id: "seed-artisan-1",
      name: "Aucun artisan approuve",
      contact: "Back office",
      city: "France",
      specialty: "Le suivi de disponibilite sera alimente des que plus de profils seront approuves.",
      status: "En attente",
      detail: "Activez des profils pour peupler cette vue.",
      tone: "amber",
      verified: false,
    },
  ]
}

function DossierCard({ company }: { company: CompanyWithUser }) {
  const documents = [
    { label: "KBIS", ready: Boolean(company.kbisUrl) },
    { label: "Assurance decennale", ready: Boolean(company.insuranceDecennaleUrl) },
    { label: "Carte d'identite recto", ready: Boolean(company.identityCardFrontUrl) },
    { label: "Carte d'identite verso", ready: Boolean(company.identityCardBackUrl) },
  ]

  return (
    <GlassCard className="overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-white">{company.legalName}</h3>
            <StatusBadge status={company.status as CompanyStatus} />
            <InlineBadge tone={company.user.emailVerified ? "emerald" : "rose"}>
              {company.user.emailVerified ? "Email verifie" : "Email non verifie"}
            </InlineBadge>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            {company.user.name} • {company.email} • {company.phone}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Ville", company.city],
              ["Adresse", company.address],
              ["SIREN", company.siren],
              ["SIRET", company.siret ?? "Non renseigne"],
              ["Code postal", company.postalCode],
              ["Cree le", formatDate(company.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {documents.map((document) => (
              <div
                key={document.label}
                className={[
                  "rounded-[1.35rem] border px-4 py-3 text-sm",
                  document.ready
                    ? "border-emerald-300/15 bg-emerald-300/10 text-emerald-50"
                    : "border-white/10 bg-white/5 text-slate-200",
                ].join(" ")}
              >
                {document.label} • {document.ready ? "Recu" : "Manquant"}
              </div>
            ))}
          </div>

          {company.rejectedReason ? (
            <div className="mt-6 rounded-[1.5rem] border border-rose-300/20 bg-rose-300/10 px-4 py-4">
              <p className="text-sm text-rose-100">Motif de refus enregistre</p>
              <p className="mt-2 text-sm leading-7 text-rose-50">{company.rejectedReason}</p>
            </div>
          ) : null}
        </div>

        <div className="w-full max-w-xl rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Decision admin</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Ce changement impacte immediatement l'acces et la lecture du dossier cote artisan.
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
  value: number
  tone: "default" | "sky" | "amber" | "emerald"
}) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white",
    sky: "border-sky-300/20 bg-sky-300/10 text-sky-50",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-50",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-50",
  }

  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function KpiTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: number
  hint: string
  accent: "amber" | "emerald" | "rose" | "slate" | "sky"
}) {
  const accents = {
    amber: "from-amber-300/18 to-transparent",
    emerald: "from-emerald-300/18 to-transparent",
    rose: "from-rose-300/18 to-transparent",
    slate: "from-slate-300/14 to-transparent",
    sky: "from-sky-300/18 to-transparent",
  }

  return (
    <div className={`rounded-[1.6rem] border border-white/10 bg-gradient-to-br ${accents[accent]} p-5`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{hint}</p>
    </div>
  )
}

function PriorityPanel({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function BandPanel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
      <h4 className="mt-2 text-lg font-semibold text-white">{title}</h4>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function SignalCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 px-5 py-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
          Live
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{detail}</p>
    </div>
  )
}

function ConversationCard({
  thread,
}: {
  thread: {
    id: string
    counterpartA: string
    counterpartB: string
    excerpt: string
    lastActivity: string
    level: string
    reason: string
    action: string
  }
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold text-white">
              {thread.counterpartA} {"<->"} {thread.counterpartB}
            </h4>
            <InlineBadge tone={thread.level === "Prioritaire" ? "rose" : thread.level === "A surveiller" ? "amber" : "default"}>
              {thread.level}
            </InlineBadge>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">{thread.excerpt}</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <MutedPanel label="Signal" value={thread.reason} />
            <MutedPanel label="Action conseillee" value={thread.action} />
          </div>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          Derniere activite • {thread.lastActivity}
        </div>
      </div>
    </div>
  )
}

function MailboxRow({
  item,
}: {
  item: { id: string; subject: string; preview: string; badge: string; tone: string }
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="text-base font-semibold text-white">{item.subject}</h4>
          <InlineBadge tone={mapTone(item.tone)}>{item.badge}</InlineBadge>
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-300">{item.preview}</p>
      </div>
      <button className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
        Ouvrir
      </button>
    </div>
  )
}

function PresenceCard({
  artisan,
}: {
  artisan: {
    id: string
    name: string
    contact: string
    city: string
    specialty: string
    status: string
    detail: string
    tone: string
    verified: boolean
  }
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-white">{artisan.name}</h4>
          <p className="mt-2 text-sm text-slate-300">{artisan.contact} • {artisan.city}</p>
        </div>
        <InlineBadge tone={mapTone(artisan.tone)}>{artisan.status}</InlineBadge>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{artisan.specialty}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span>{artisan.detail}</span>
        <span className="text-slate-500">•</span>
        <span>{artisan.verified ? "Email verifie" : "Email a confirmer"}</span>
      </div>
    </div>
  )
}

function MarketCard({
  market,
  mode,
  action,
}: {
  market: MarketWithOwner
  mode: "live" | "review"
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="text-lg font-semibold text-white">{market.title}</h4>
        <InlineBadge tone={marketTone(market.status as MarketStatus)}>
          {marketStatusLabel(market.status as MarketStatus)}
        </InlineBadge>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{market.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MutedPanel label="Activite" value={market.activity} />
        <MutedPanel label="Ville" value={`${market.city} (${market.postalCode})`} />
        <MutedPanel label="Budget" value={formatBudget(market.budgetMin, market.budgetMax)} />
        <MutedPanel label="Delai" value={market.timeframe ?? "A preciser"} />
        <MutedPanel label="Origine" value={market.ownerCompany.legalName} />
        <MutedPanel label="Contact" value={`${market.ownerUser.name} • ${market.ownerCompany.phone}`} />
      </div>

      {market.rejectionReason ? (
        <div className="mt-4 rounded-[1.4rem] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          Motif de retour : {market.rejectionReason}
        </div>
      ) : null}

      {market.adminNotes ? (
        <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          Note admin : {market.adminNotes}
        </div>
      ) : null}

      <form action={action} className="mt-5 space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <input type="hidden" name="marketId" value={market.id} />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <select
            name="status"
            defaultValue={mode === "review" ? "PENDING_REVIEW" : market.status}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/60"
          >
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="LIVE">LIVE</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <button
            type="submit"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Mettre a jour
          </button>
        </div>

        <textarea
          name="adminNotes"
          rows={3}
          defaultValue={market.adminNotes ?? ""}
          placeholder="Note interne ou recommandation avant diffusion"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-sky-300/60"
        />

        <textarea
          name="rejectionReason"
          rows={3}
          defaultValue={market.rejectionReason ?? ""}
          placeholder="Motif de retour si le marche doit etre corrige par le donneur"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-sky-300/60"
        />
      </form>
    </div>
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

function EmptyInline({ text }: { text: string }) {
  return <p className="text-sm leading-7 text-slate-300">{text}</p>
}

function RowLine({ title, subtitle, meta }: { title: string; subtitle: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{meta}</span>
    </div>
  )
}

function InlineBadge({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: "default" | "amber" | "rose" | "emerald" | "sky" | "slate"
}) {
  const styles = {
    default: "border-white/10 bg-white/5 text-slate-200",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-50",
    rose: "border-rose-300/20 bg-rose-300/10 text-rose-50",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-50",
    sky: "border-sky-300/20 bg-sky-300/10 text-sky-50",
    slate: "border-slate-300/20 bg-slate-300/10 text-slate-100",
  }

  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[tone]}`}>{children}</span>
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
      href={href}
      className={[
        "rounded-full border px-4 py-2 transition",
        active
          ? "border-sky-300/30 bg-sky-300/15 text-white"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
      ].join(" ")}
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

  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${classes[status]}`}>{statusLabel(status)}</span>
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

function marketStatusLabel(status: MarketStatus) {
  switch (status) {
    case "PENDING_REVIEW":
      return "En validation"
    case "LIVE":
      return "En ligne"
    case "REJECTED":
      return "Retour admin"
    case "ARCHIVED":
      return "Archive"
  }
}

function marketTone(status: MarketStatus): "amber" | "emerald" | "rose" | "slate" {
  switch (status) {
    case "PENDING_REVIEW":
      return "amber"
    case "LIVE":
      return "emerald"
    case "REJECTED":
      return "rose"
    case "ARCHIVED":
      return "slate"
  }
}

function tabHref(tab: AdminTab, status?: CompanyStatus) {
  const params = new URLSearchParams()

  if (tab !== "overview") {
    params.set("tab", tab)
  }

  if (status) {
    params.set("status", status)
  }

  const query = params.toString()
  return query ? `/admin?${query}` : "/admin"
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value)
}

function relativeLabel(daysAgo: number) {
  if (daysAgo <= 0) return "Maintenant"
  if (daysAgo === 1) return "Il y a 1 jour"
  return `Il y a ${daysAgo} jours`
}

function buildSpecialty(company: CompanyWithUser) {
  const specialties = [
    "Renovation interieure et finitions premium.",
    "Structure, gros oeuvre et coordination terrain.",
    "Second oeuvre avec exigence de presentation client.",
    "Interventions rapides et organisation de chantier.",
  ]

  const seed = company.city.length % specialties.length
  return specialties[seed]
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

function normalizeString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapTone(value: string): "default" | "amber" | "rose" | "emerald" | "sky" {
  switch (value) {
    case "amber":
      return "amber"
    case "rose":
      return "rose"
    case "emerald":
      return "emerald"
    case "sky":
      return "sky"
    default:
      return "default"
  }
}
