import Link from "next/link"
import styles from "./lecture.module.css"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <main className={styles.page}><article>
    <Link href="/">Retour à l’accueil</Link>
    {children}
  </article></main>
}
