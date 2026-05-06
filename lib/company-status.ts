type StatusCopy = {
  title: string
  description: string
  toneClass: string
}

const statusMap: Record<string, StatusCopy> = {
  PENDING: {
    title: "Votre dossier est en cours d'etude",
    description:
      "Votre profil a bien ete recu et reste en attente de validation par l'equipe FONDATIA.",
    toneClass: "text-amber-200",
  },
  APPROVED: {
    title: "Votre profil est valide",
    description:
      "Votre dossier est approuve. La base est prete pour les prochaines briques autour des leads et des opportunites.",
    toneClass: "text-emerald-200",
  },
  REJECTED: {
    title: "Votre dossier a ete refuse",
    description:
      "Le dossier n'a pas ete retenu en l'etat. Une prochaine iteration pourra mieux exposer le motif et les suites possibles.",
    toneClass: "text-red-200",
  },
  BLOCKED: {
    title: "Votre acces est bloque",
    description:
      "Le compte ou le profil artisan est suspendu. Cet etat reste visible de maniere claire dans le dashboard.",
    toneClass: "text-zinc-200",
  },
}

export function getCompanyStatusCopy(status: string) {
  return statusMap[status] ?? statusMap.PENDING
}
