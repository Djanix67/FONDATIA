import Link from "next/link"

export const metadata = { title: "Conditions générales d’utilisation | FONDATIA" }

export default function ConditionsPage() {
  return <>
    <h1>Conditions générales d’utilisation</h1>
    <p>Version du 25 novembre 2026 · Essais privés</p>
    <h2>Objet et accès</h2>
    <p>FONDATIA permet à des professionnels du bâtiment de préparer des marchés de travaux et de rechercher des entreprises pour les réaliser. Cette version est réservée au propriétaire et aux testeurs invités. Utilisez des entreprises, coordonnées et pièces fictives pour les essais. Aucun travail réel ne doit être commandé dans cet espace.</p>
    <h2>Compte et dossier d’entreprise</h2>
    <p>Le donneur d’ordre décrit son besoin. L’artisan présente son entreprise et ses justificatifs. L’administrateur examine les dossiers et les marchés. Chaque utilisateur garde ses identifiants personnels et signale toute utilisation suspecte. L’accès aux différentes fonctions dépend du rôle et du statut du dossier.</p>
    <h2>Portée des contrôles</h2>
    <p>La validation d’un dossier indique qu’il a été examiné. Elle ne garantit ni la solvabilité de l’entreprise, ni la qualité des travaux, ni la couverture d’un chantier par son assurance décennale. Avant tout engagement réel, les professionnels doivent notamment vérifier les activités assurées, les dates et les conditions de la police.</p>
    <h2>Marchés, documents et engagements</h2>
    <p>L’auteur d’un marché ou d’un document répond de son contenu et doit disposer des droits nécessaires à sa diffusion. Il communique uniquement les informations utiles aux destinataires autorisés. Une publication, une attribution ou un changement de statut en phase de test ne vaut ni signature de devis ni ordre de commencer les travaux. Aucun abonnement, commission ou paiement de chantier n’est encaissé pendant les essais.</p>
    <h2>Conduite et confidentialité</h2>
    <p>Sont interdits les faux justificatifs présentés comme authentiques, l’usurpation d’identité, le démarchage non sollicité et la divulgation des dossiers d’autres utilisateurs. Les contenus de test doivent être identifiables comme tels. Les droits sur les contenus déposés restent à leurs titulaires. Leur utilisation par FONDATIA est limitée au fonctionnement du service.</p>
    <h2>Signalement, suspension et clôture</h2>
    <p>Pour signaler un contenu, contester une décision ou demander la clôture de votre compte, écrivez au contact du projet en précisant le dossier concerné. Évitez de joindre une pièce d’identité par e-mail. L’administrateur peut demander une correction, retirer un contenu ou suspendre un accès en cas de détournement ou de risque pour les autres utilisateurs. Vous pouvez demander le motif et présenter vos observations.</p>
    <h2>Disponibilité, responsabilité et contact</h2>
    <p>Le service d’essai peut être interrompu pour maintenance. Conservez vos propres exemplaires des documents. FONDATIA ne réalise pas les travaux et ne se substitue pas aux entreprises dans leurs obligations. Les présentes conditions sont soumises au droit français, sous réserve des dispositions impératives applicables. Toute difficulté peut être soumise au contact du projet pour rechercher une solution amiable.</p>
    <p>Contact du projet : <a href="mailto:caner.pro@hotmail.com">caner.pro@hotmail.com</a>. L’identité juridique complète de l’exploitant et les conditions commerciales seront précisées avant l’ouverture à de vrais clients.</p>
    <p><Link href="/politique-de-confidentialite">Consulter la politique de confidentialité</Link></p>
  </>
}
