export function applicationReceivedTemplate(legalName: string) {
  return {
    subject: "FONDATIA - dossier recu",
    html: `
      <div style="font-family: Arial, sans-serif; color: #101828; line-height: 1.6;">
        <h1>FONDATIA</h1>
        <p>Bonjour,</p>
        <p>Nous confirmons la bonne reception du dossier de <strong>${legalName}</strong>.</p>
        <p>Votre dossier est maintenant en cours d'etude par notre equipe.</p>
      </div>
    `,
  }
}

export function emailVerificationTemplate(verificationUrl: string) {
  return {
    subject: "FONDATIA - confirmez votre adresse email",
    html: `
      <div style="font-family: Arial, sans-serif; color: #101828; line-height: 1.6;">
        <h1>FONDATIA</h1>
        <p>Bonjour,</p>
        <p>Merci de confirmer votre adresse email pour finaliser l'activation de votre dossier.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#102a56;color:#ffffff;text-decoration:none;font-weight:600;">
            Confirmer mon email
          </a>
        </p>
        <p>Si le bouton ne fonctionne pas, utilisez ce lien : ${verificationUrl}</p>
      </div>
    `,
  }
}

export function applicationApprovedTemplate(legalName: string) {
  return {
    subject: "FONDATIA - dossier valide",
    html: `
      <div style="font-family: Arial, sans-serif; color: #101828; line-height: 1.6;">
        <h1>FONDATIA</h1>
        <p>Bonjour,</p>
        <p>Le dossier de <strong>${legalName}</strong> a ete valide.</p>
        <p>Votre acces artisan est pret pour les prochaines etapes de la plateforme.</p>
      </div>
    `,
  }
}

export function applicationRejectedTemplate(legalName: string, reason?: string) {
  return {
    subject: "FONDATIA - dossier refuse",
    html: `
      <div style="font-family: Arial, sans-serif; color: #101828; line-height: 1.6;">
        <h1>FONDATIA</h1>
        <p>Bonjour,</p>
        <p>Le dossier de <strong>${legalName}</strong> n'a pas ete retenu en l'etat.</p>
        ${reason ? `<p>Motif communique : ${reason}</p>` : ""}
      </div>
    `,
  }
}
