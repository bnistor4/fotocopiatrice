// Piccoli componenti presentazionali condivisi (server-safe, nessun client JS).
import Link from "next/link";
import { pct } from "@/lib/data";
import { voce } from "@/lib/testi";

/** Parola spiegata nel glossario: sottolineatura tratteggiata, link all'ancora. */
export function Termine({ id, children }: { id: string; children?: React.ReactNode }) {
  const v = voce(id);
  return (
    <Link href={`/glossario#${id}`} title={v?.breve} className="termine">
      {children ?? v?.titolo ?? id}
    </Link>
  );
}

/** Didascalia breve sotto titoli/stat: una riga dalla voce di glossario. */
export function Spiega({ id }: { id: string }) {
  const v = voce(id);
  if (!v) return null;
  return <p className="text-[13px] text-(--color-faded)">{v.breve}</p>;
}

export function Card({
  title,
  eyebrow,
  aside,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  eyebrow?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(eyebrow || title || aside) && (
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="card-title mt-0.5">{title}</h2>}
          </div>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  sub,
  className = "",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="eyebrow">{label}</p>
      <p className="display num mt-1 text-[32px] leading-none lg:text-4xl">{value}</p>
      {sub && <p className="mt-1.5 text-[13px] text-(--color-faded)">{sub}</p>}
    </div>
  );
}

/** Etichetta eyebrow + barra sottile + percentuale grande. */
export function Meter({ label, p, tone }: { label: React.ReactNode; p: number; tone?: "navy" }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <div className="meter-track mt-1.5">
        <div
          className={`meter-fill ${tone ?? ""}`}
          style={{ width: `${Math.round(p * 100)}%` }}
        />
      </div>
      <p className="num mt-1 text-base font-semibold">{pct(p)}</p>
    </div>
  );
}

/** Riga chiave/valore con barra sottile e percentuale (ambiti, esiti). */
export function Row({
  label,
  value,
  pct: p,
  bar,
  tone,
}: {
  label: React.ReactNode;
  value: string;
  pct?: number;
  bar?: number;
  tone?: "navy" | "ok" | "accent" | "faded";
}) {
  return (
    <div className="flex items-center gap-3 border-b border-(--color-line) py-2.5 last:border-b-0">
      <span className="w-36 shrink-0 text-sm leading-snug sm:w-56">{label}</span>
      <div className="meter-track grow">
        <div
          className={`meter-fill ${tone ?? "navy"}`}
          style={{ width: `${Math.round((bar ?? p ?? 0) * 100)}%` }}
        />
      </div>
      <span className="num w-24 shrink-0 text-right text-sm whitespace-nowrap sm:w-28">
        {value}
        {p != null && <span className="text-(--color-faded)"> · {pct(p)}</span>}
      </span>
    </div>
  );
}
