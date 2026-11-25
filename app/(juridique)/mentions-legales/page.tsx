import Link from "next/link"
export const metadata = { title: "Mentions légales | FONDATIA" }
export default function MentionsLegales() {
  return <>
    <h1>Mentions légales</h1>
    <p>Version privée du 25 novembre 2026</p>
    <h2>Édition et direction de la publication</h2>
    <p>FONDATIA est un projet de plateforme de mise en relation entre professionnels du bâtiment. Cette version est accessible sur invitation pour des essais. Pour contacter le responsable du projet ou signaler un contenu, écrivez à <a href="mailto:caner.pro@hotmail.com">caner.pro@hotmail.com</a>.</p>
    <p>Avant l’ouverture commerciale, cette rubrique sera complétée avec l’identité de l’éditeur et du directeur de la publication, l’adresse professionnelle, le téléphone et les renseignements d’immatriculation applicables à la forme juridique retenue.</p>
    <h2>Hébergement du site</h2>
    <p>Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. <a href="https://vercel.com/contact">Contacter Vercel</a>.</p>
    <h2>Contenus et documents</h2>
    <p>Les entreprises conservent leurs droits sur les documents et contenus qu’elles déposent. Leur présence dans un espace privé n’autorise pas leur réutilisation ou leur diffusion à des tiers.</p>
    <h2>Utilisation du service et données personnelles</h2>
    <p>Les <Link href="/conditions-generales-utilisation">conditions générales d’utilisation</Link> décrivent les règles du service. La <Link href="/politique-de-confidentialite">politique de confidentialité</Link> précise l’usage des données et les modalités d’exercice de vos droits.</p>
  </>
}
