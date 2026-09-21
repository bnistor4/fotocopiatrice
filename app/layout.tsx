import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { Source_Serif_4 } from "next/font/google";
import Nav from "./Nav";
import "./globals.css";

const displayFont = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "Fotocopiatrice — chi scrive davvero gli emendamenti",
  description:
    "Tutti gli emendamenti alla legge di bilancio letti da un programma: quante sono le copie parola per parola, chi le firma e quanto costa leggerli tutti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${GeistSans.variable} ${displayFont.variable}`}>
      <body className="min-h-screen">
        <header className="border-b border-(--color-line) bg-(--color-card)">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="block h-6 w-[18px] shrink-0 rounded-[2px] border border-(--color-line)"
                style={{
                  background:
                    "linear-gradient(90deg,#009246 0 33.4%,#f6f7f8 33.4% 66.7%,#ce2b37 66.7% 100%)",
                }}
              />
              <Link href="/" className="display text-[22px] font-semibold leading-none">
                Fotocopiatrice
              </Link>
              <p className="hidden text-[13px] text-(--color-faded) md:block">
                chi scrive davvero gli emendamenti
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://documenti.camera.it"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-(--color-line-strong) px-3.5 py-1.5 text-[13px] font-medium text-(--color-accent) hover:border-(--color-accent)"
              >
                Fonte: camera.it ↗
              </a>
              <Link
                href="/metodo"
                className="rounded-full border border-(--color-line-strong) px-3.5 py-1.5 text-[13px] font-medium text-(--color-ink-soft) hover:border-(--color-ink) hover:text-(--color-ink)"
              >
                Come è fatto
              </Link>
            </div>
          </div>
        </header>
        <div className="border-b border-(--color-line)">
          <div className="mx-auto max-w-[1200px] px-4 py-3">
            <Nav />
          </div>
        </div>
        <main className="mx-auto max-w-[1200px] px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-[1200px] px-4 pb-10">
          <div className="card text-[13px] text-(--color-ink-soft)">
            <p>
              Fonte: i documenti ufficiali della Camera dei deputati (documenti.camera.it,
              dati.camera.it). Lettura automatica con il programma Jev di TypeSafe, eseguita
              sul nostro computer; il sito contiene solo i risultati. Le percentuali sono
              stime, non verdetti: il testo originale è sempre a un clic.
            </p>
            <p className="mt-2 text-(--color-faded)">
              Usiamo un programma di lettura automatica. Sono possibili errori: verifica
              sempre il testo ufficiale.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
