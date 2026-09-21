import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fotocopiatrice — chi scrive davvero gli emendamenti",
  description:
    "Tutti gli emendamenti alla legge di bilancio letti da un programma: quante sono le copie parola per parola, chi le firma e quanto costa leggerli tutti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen">
        <header className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rule-double" />
          <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
            <Link href="/" className="masthead-title text-4xl sm:text-5xl font-bold">
              Fotocopiatrice
            </Link>
            <p className="label">
              Tutti gli emendamenti alla legge di bilancio, letti da un programma e spiegati
            </p>
          </div>
          <nav className="rule-thin flex flex-wrap gap-x-6 gap-y-1 border-b border-(--color-line) py-2">
            <Link href="/" className="label hover:text-(--color-accent)">In breve</Link>
            <Link href="/coppie" className="label hover:text-(--color-accent)">Copie a confronto</Link>
            <Link href="/gruppi" className="label hover:text-(--color-accent)">Chi copia chi</Link>
            <Link href="/glossario" className="label hover:text-(--color-accent)">Le parole</Link>
            <Link href="/metodo" className="label hover:text-(--color-accent)">Come è fatto</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10">
          <div className="rule-thin pt-4 text-xs text-(--color-faded)">
            <p>
              Fonte: i documenti ufficiali della Camera dei deputati (documenti.camera.it,
              dati.camera.it). Lettura automatica con il programma Jev di TypeSafe, eseguita
              sul nostro computer; il sito contiene solo i risultati. Le percentuali sono
              stime, non verdetti: il testo originale è sempre a un clic.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
