import { CompanyStatus } from "@prisma/client"

type StatusCopy = {
  title: string
  description: string
  toneClass: string
  dotClass: string
}

const statusMap: Record<CompanyStatus, StatusCopy> = {
  PENDING: {
    title: "Votre dossier est en cours d'etude",
    description:
      "Votre profil a bien ete recu et reste en attente de validation par l'equipe FONDATIA.",
    toneClass: "text-amber-200",
    dotClass: "bg-amber-300",
  },
  APPROVED: {
    title: "Votre profil est valide",
    description:
      "Votre dossier est approuve. La base est prete pour les prochaines briques autour des leads et des opportunites.",
    toneClass: "text-emerald-200",
    dotClass: "bg-emerald-300",
  },
  REJECTED: {
    title: "Votre dossier a ete refuse",
    description:
      "Le dossier n'a pas ete retenu en l'etat. Le tableau de bord met maintenant en avant le motif communique et les prochaines actions utiles.",
    toneClass: "text-red-200",
    dotClass: "bg-rose-300",
  },
  BLOCKED: {
    title: "Votre acces est bloque",
    description:
      "Le compte ou le profil artisan est suspendu. Cet etat reste visible de maniere claire dans le dashboard.",
    toneClass: "text-zinc-200",
    dotClass: "bg-slate-400",
  },
}

export function getCompanyStatusCopy(status: string) {
  return statusMap[(status as CompanyStatus) ?? "PENDING"] ?? statusMap.PENDING
}
