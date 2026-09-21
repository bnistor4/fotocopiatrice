"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "In breve" },
  { href: "/coppie", label: "Copie a confronto" },
  { href: "/gruppi", label: "Chi copia chi" },
  { href: "/glossario", label: "Le parole" },
  { href: "/metodo", label: "Come è fatto" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? "border-(--color-navy) bg-(--color-navy) text-white"
                : "border-(--color-line-strong) bg-(--color-card) text-(--color-ink-soft) hover:border-(--color-ink) hover:text-(--color-ink)"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
