import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fotocopiatrice — gli emendamenti fotocopiati",
  description:
    "Analisi automatica degli emendamenti parlamentari con il modello Jev di TypeSafe: copie, provvedimenti localistici e costi.",
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
            <p className="label">Emendamenti alla Camera, letti da una macchina</p>
          </div>
          <nav className="rule-thin flex flex-wrap gap-x-6 gap-y-1 border-b border-(--color-line) py-2">
            <Link href="/" className="label hover:text-(--color-accent)">L'atto</Link>
            <Link href="/coppie" className="label hover:text-(--color-accent)">Le coppie</Link>
            <Link href="/gruppi" className="label hover:text-(--color-accent)">Chi copia chi</Link>
            <Link href="/metodo" className="label hover:text-(--color-accent)">Metodo</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10">
          <div className="rule-thin pt-4 text-xs text-(--color-faded)">
            <p>
              Fonte dati: documenti.camera.it e dati.camera.it (SPARQL). Analisi locale con il
              modello Jev di TypeSafe; il sito pubblicato contiene solo dati aggregati in JSON.
              Le probabilità indicate non sono verdetti: sono stime automatiche da verificare.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
