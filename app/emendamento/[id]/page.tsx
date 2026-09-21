import Link from "next/link";
import { notFound } from "next/navigation";
import { ProbBar, Termine } from "@/app/components";
import {
  fmtData,
  fmtEuro,
  getEmendamenti,
  getEmendamento,
  getLatestAtto,
  pct,
} from "@/lib/data";
import { nomeAmbito, nomeEsito, nomeGruppo } from "@/lib/testi";

export function generateStaticParams() {
  const atto = getLatestAtto();
  if (!atto) return [];
  return getEmendamenti(atto.attoId).map((e) => ({ id: e.key }));
}

export default async function EmendamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ atto?: string }>;
}) {
  const { id } = await params;
  const { atto: attoParam } = await searchParams;
  const atto = getLatestAtto();
  const attoId = attoParam ?? atto?.attoId;
  if (!attoId) notFound();
  const e = getEmendamento(attoId, decodeURIComponent(id));
  if (!e) notFound();
  const a = e.answers;

  return (
    <div className="space-y-8">
      <header className="border-b border-(--color-line) pb-4">
        <p className="label">
          <Link href="/" className="hover:text-(--color-accent)">← indice</Link>
          {" · "}seduta del {fmtData(e.seduta)}
          {e.sedute.length > 1 && ` (+ altre ${e.sedute.length - 1})`} · art. {e.articolo}
        </p>
        <h1 className="masthead-title mt-1 text-4xl">Emendamento {e.id}</h1>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-(--color-ink-soft)">
          <span>
            Che fine ha fatto:{" "}
            <strong>{e.esito ? nomeEsito(e.esito) : nomeEsito("non_indicato")}</strong>
            {e.esitoAnnotazione ? ` (${e.esitoAnnotazione})` : ""}
          </span>
          {e.nuovaFormulazione && (
            <span className="text-(--color-accent)">
              <Termine id="riformulazione">nuova formulazione</Termine>
            </span>
          )}
          {e.sedute.length > 1 && (
            <span className="text-(--color-faded)">
              <Termine id="ripubblicato">ripubblicato</Termine>:{" "}
              {e.sedute.map(fmtData).join(", ")}
            </span>
          )}
          {e.riformulaDi && (
            <span>
              riformulazione di{" "}
              <Link
                href={`/emendamento/${encodeURIComponent(e.riformulaDi)}?atto=${attoId}`}
                className="text-(--color-accent) underline underline-offset-4"
              >
                Em. {e.riformulaDi.split(":")[1]}
              </Link>
            </span>
          )}
          {e.importoEuro != null && (
            <span>
              Cifra scritta nel testo:{" "}
              <strong className="num">{fmtEuro(e.importoEuro)}</strong>
            </span>
          )}
          <a
            href={e.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-(--color-accent) underline underline-offset-4"
          >
            fonte: camera.it ↗
          </a>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="label">Il testo della proposta</h2>
          <p className="mt-3 whitespace-pre-line text-[1.05rem] leading-relaxed">{e.testo}</p>
        </div>
        <aside className="space-y-6">
          <div>
            <h2 className="label border-b border-(--color-line) pb-1">Chi lo firma</h2>
            <ul className="mt-2 space-y-0.5 text-sm">
              {e.firmatari.map((f, i) => (
                <li key={`${f.idPersona}-${i}`}>
                  {f.nome}
                  {i === 0 && <span className="text-(--color-faded)"> (primo firmatario)</span>}
                </li>
              ))}
              {e.firmatari.length === 0 && <li className="text-(--color-faded)">—</li>}
            </ul>
            {e.gruppi.length > 0 && (
              <p className="label mt-2">
                partiti: {e.gruppi.map((g) => `${nomeGruppo(g)} (${g})`).join(" · ")}
              </p>
            )}
          </div>
          {e.identKeys.length > 0 && (
            <div>
              <h2 className="label border-b border-(--color-line) pb-1">
                <Termine id="segnalato-identico">La Camera lo segna identico a</Termine>
              </h2>
              <ul className="mt-2 space-y-0.5 text-sm">
                {e.identKeys.map((k) => (
                  <li key={k}>
                    <Link
                      href={`/emendamento/${encodeURIComponent(k)}?atto=${attoId}`}
                      className="text-(--color-accent) underline underline-offset-4"
                    >
                      Em. {k.split(":")[1]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      <section>
        <h2 className="masthead-title border-b border-(--color-line) pb-2 text-2xl">
          Come lo ha letto il programma
        </h2>
        <p className="mt-2 text-xs text-(--color-faded)">
          Ogni barra è quanto il programma è sicuro della risposta — una{" "}
          <Termine id="probabilita">probabilità</Termine>, non un verdetto.
        </p>
        {a ? (
          <div className="mt-4 grid gap-x-10 gap-y-3 lg:grid-cols-2">
            <ProbBar p={a.articolo_aggiuntivo} label="aggiunge un articolo nuovo" />
            <ProbBar p={a.soppressivo} label="cancella una parte" />
            <ProbBar p={a.localistico} label="per un luogo o ente preciso" />
            <ProbBar p={a.beneficiario_identificabile} label="si capisce chi ci guadagna" />
            <ProbBar p={a.copertura_indicata} label="dice da dove vengono i soldi" />
            <div className="flex items-center gap-2">
              <span className="label w-40 shrink-0">di cosa parla</span>
              <span className="text-sm">
                {nomeAmbito(a.ambito.choice)}{" "}
                <span className="text-(--color-faded)">({pct(a.ambito.probabilities[a.ambito.choice] ?? 0)})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="label w-40 shrink-0">quanto è su misura</span>
              <span className="num text-sm">
                {a.micro_intervento.score.toFixed(1)} / 3{" "}
                <span className="text-(--color-faded)">
                  (0 = regola per tutti, 3 = mancetta)
                </span>
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-(--color-faded)">
            Questo emendamento non è ancora stato letto dal programma.
          </p>
        )}
      </section>
    </div>
  );
}
