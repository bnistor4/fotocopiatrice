import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Meter, Termine } from "@/app/components";
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

const esitoPill = (esito: string | null) => {
  const k = esito ?? "non_indicato";
  const cls =
    k === "approvato"
      ? "border-(--color-ok) text-(--color-ok)"
      : k === "inammissibile"
        ? "border-(--color-accent) text-(--color-accent)"
        : "border-(--color-line-strong) text-(--color-faded)";
  return { label: nomeEsito(k), cls };
};

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
  const esito = esitoPill(e.esito);

  const pill =
    "rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px]">
          <Link href="/" className="text-(--color-ink-soft) hover:text-(--color-accent)">
            ← In breve
          </Link>
        </p>
        <p className="eyebrow mt-3">
          Emendamento {e.id} · art. {e.articolo} · seduta del {fmtData(e.seduta)}
          {e.sedute.length > 1 && ` (+ altre ${e.sedute.length - 1})`}
        </p>
        <h1 className="display mt-1 text-4xl">Emendamento {e.id}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`${pill} ${esito.cls}`}>
            {esito.label}
            {e.esitoAnnotazione ? ` (${e.esitoAnnotazione})` : ""}
          </span>
          {e.nuovaFormulazione && (
            <Termine id="riformulazione">
              <span className={`${pill} border-(--color-accent) text-(--color-accent)`}>
                nuova formulazione
              </span>
            </Termine>
          )}
          {e.sedute.length > 1 && (
            <span className={`${pill} border-(--color-line-strong) text-(--color-faded)`}>
              <Termine id="ripubblicato">ripubblicato</Termine>:{" "}
              {e.sedute.map(fmtData).join(", ")}
            </span>
          )}
          {e.riformulaDi && (
            <Link
              href={`/emendamento/${encodeURIComponent(e.riformulaDi)}?atto=${attoId}`}
              className={`${pill} border-(--color-line-strong) text-(--color-ink-soft) hover:border-(--color-accent)`}
            >
              riformulazione di Em. {e.riformulaDi.split(":")[1]}
            </Link>
          )}
          {e.importoEuro != null && (
            <span className={`${pill} border-(--color-line-strong) text-(--color-ink)`}>
              Cifra nel testo: <strong className="num">{fmtEuro(e.importoEuro)}</strong>
            </span>
          )}
          <a
            href={e.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className={`${pill} border-(--color-accent) text-(--color-accent)`}
          >
            fonte: camera.it ↗
          </a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card title="Testo della proposta" className="lg:col-span-8">
          <p className="whitespace-pre-line text-base leading-[1.7]">{e.testo}</p>
        </Card>
        <div className="space-y-6 lg:col-span-4">
          <Card title="Chi lo firma">
            <ul className="space-y-1.5 text-sm">
              {e.firmatari.map((f, i) => (
                <li key={`${f.idPersona}-${i}`} className="flex items-center gap-2">
                  <span className={i === 0 ? "font-semibold" : ""}>{f.nome}</span>
                  {i === 0 && (
                    <span className="rounded-full bg-(--color-bg) px-2 py-0.5 text-[11px] font-semibold text-(--color-faded)">
                      primo firmatario
                    </span>
                  )}
                </li>
              ))}
              {e.firmatari.length === 0 && <li className="text-(--color-faded)">—</li>}
            </ul>
            {e.gruppi.length > 0 && (
              <p className="eyebrow mt-3 normal-case">
                partiti: {e.gruppi.map((g) => `${nomeGruppo(g)} (${g})`).join(" · ")}
              </p>
            )}
          </Card>
          {e.identKeys.length > 0 && (
            <Card title={<Termine id="segnalato-identico">La Camera lo segna identico a</Termine>}>
              <ul className="space-y-1 text-sm">
                {e.identKeys.map((k) => (
                  <li key={k}>
                    <Link
                      href={`/emendamento/${encodeURIComponent(k)}?atto=${attoId}`}
                      className="font-medium text-(--color-accent)"
                    >
                      Em. {k.split(":")[1]}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Card title="Come lo ha letto il programma">
        <p className="mb-4 text-[13px] text-(--color-faded)">
          Ogni barra è quanto il programma è sicuro della risposta — una{" "}
          <Termine id="probabilita">probabilità</Termine>, non un verdetto.
        </p>
        {a ? (
          <div className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
            <Meter p={a.articolo_aggiuntivo} label="aggiunge un articolo nuovo" />
            <Meter p={a.soppressivo} label="cancella una parte" />
            <Meter p={a.localistico} label="per un luogo o ente preciso" />
            <Meter p={a.beneficiario_identificabile} label="si capisce chi ci guadagna" />
            <Meter p={a.copertura_indicata} label="dice da dove vengono i soldi" />
            <div>
              <p className="eyebrow">di cosa parla</p>
              <p className="mt-1.5 text-sm">
                {nomeAmbito(a.ambito.choice)}{" "}
                <span className="num text-(--color-faded)">
                  ({pct(a.ambito.probabilities[a.ambito.choice] ?? 0)})
                </span>
              </p>
            </div>
            <div>
              <p className="eyebrow">quanto è su misura</p>
              <p className="num mt-1.5 text-sm">
                {a.micro_intervento.score.toFixed(1)} / 3{" "}
                <span className="text-(--color-faded)">
                  (0 = regola per tutti, 3 = mancetta)
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-(--color-faded)">
            Questo emendamento non è ancora stato letto dal programma.
          </p>
        )}
      </Card>
    </div>
  );
}
