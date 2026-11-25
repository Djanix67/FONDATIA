import Link from "next/link"

export const metadata = { title: "Politique de confidentialité | FONDATIA" }

export default function PrivacyPage() {
  return <>
    <h1>Politique de confidentialité</h1>
    <p>Utilisation de vos données personnelles · Version du 25 novembre 2026</p>
    <h2>Qui contacter</h2>
    <p>Pour toute question sur les données de la version privée, contactez le porteur du projet FONDATIA à <a href="mailto:caner.pro@hotmail.com">caner.pro@hotmail.com</a>. L’identité juridique complète et les coordonnées de l’exploitant restent à compléter avant la collecte de dossiers professionnels réels.</p>
    <h2>Avant de remplir le formulaire</h2>
    <p>Utilisez uniquement des données fictives et des documents de démonstration. La sélection d’un fichier déclenche son envoi avant même la validation du formulaire. Ne choisissez aucune véritable carte d’identité, attestation décennale ou pièce d’immatriculation. Même en test, votre connexion à Vercel et vos demandes adressées au support peuvent contenir des données personnelles.</p>
    <h2>Données utilisées et raisons du traitement</h2>
    <p>Pour fournir l’espace demandé, le formulaire prévoit le nom du gérant, son e-mail, son téléphone, sa raison sociale, son SIREN, son adresse professionnelle et le profil choisi. Le serveur utilise une empreinte du mot de passe pour vérifier la connexion. Les champs et justificatifs obligatoires conditionnent l’envoi du dossier. Le traitement des demandes de compte et de support vise à fournir le service demandé, sur une base contractuelle lorsque la personne est partie au contrat. Pour le représentant d’une entreprise, il relève de l’intérêt légitime à gérer la relation professionnelle.</p>
    <p>Les pièces déposées, l’état du dossier et les décisions administratives servent à examiner les candidatures. Les informations de marché et d’attribution servent au suivi des mises en relation. L’identification des accès, les témoins de session et les journaux techniques répondent à l’intérêt légitime de sécuriser le service et de résoudre les incidents.</p>
    <h2>Qui peut recevoir vos données</h2>
    <p>Les dossiers d’admission sont destinés à l’administration. Les professionnels accèdent aux informations de marché prévues pour leur rôle. Vercel héberge le site et filtre l’accès privé. Supabase est le service prévu pour la base et le stockage privé des pièces. Le code prévoit Resend pour les e-mails transactionnels lorsqu’il est configuré. Le projet Supabase est situé en région européenne. L’hébergement de cette base en Europe ne garantit pas que tous les traitements des prestataires y ont lieu. Le détail des transferts éventuels et des garanties devra être confirmé avant l’ouverture aux clients.</p>
    <p>La page d’accueil utilise aussi des images chargées depuis Unsplash. Leur chargement peut transmettre à ce service des informations techniques, notamment votre adresse IP. Les documents de candidature ne sont pas destinés à ce service. Aucun transfert de dossiers vers Optimum Décennale ni aucune commercialisation de profils auprès d’assureurs ne sont prévus pour cette version.</p>
    <h2>Conservation</h2>
    <p>Les dossiers fictifs servent pendant la période de vérification. Les fichiers envoyés avant l’abandon d’un formulaire peuvent subsister dans le stockage. Pour faire retirer un dossier ou un fichier, indiquez au contact du projet la date approximative de l’envoi et l’adresse associée. Les durées de purge des fichiers abandonnés, des journaux, des comptes et des sauvegardes restent à fixer et à vérifier avant toute collecte réelle de dossiers.</p>
    <h2>Vos droits</h2>
    <p>Vous pouvez demander l’accès, la rectification, l’effacement ou la limitation du traitement de vos données. Selon la base du traitement, vous pouvez également demander leur portabilité, vous opposer au traitement pour des raisons tenant à votre situation ou retirer un consentement facultatif. Adressez votre demande au contact ci-dessus. En cas de doute raisonnable sur l’identité du demandeur, une vérification proportionnée pourra être nécessaire. Vous pouvez également <a href="https://www.cnil.fr/fr/plaintes">adresser une réclamation à la CNIL</a>.</p>
    <p><Link href="/conditions-generales-utilisation">Consulter les conditions générales d’utilisation</Link></p>
  </>
}
