import { fmtNum, getLatestAtto, getValutazione, pct } from "@/lib/data";
import { Card, Termine } from "@/app/components";
import { COSA_NON_DICE, DATI_USATI } from "@/lib/testi";

export const metadata = { title: "Come è fatto — Fotocopiatrice" };

const DOMANDE_SINGOLO = [
  ["Aggiunge un articolo nuovo", "propone qualcosa che nella legge non c'era, invece di correggere o cancellare?"],
  ["Cancella una parte", "chiede di togliere un articolo, un comma o delle parole?"],
  ["Per un luogo o ente preciso", "destina soldi o vantaggi a un territorio, un ente, una manifestazione o un'azienda nominati?"],
  ["Si capisce chi ci guadagna", "un lettore può capire concretamente chi ci guadagna — un ente nominato o un gruppo molto ristretto?"],
  ["Dice da dove vengono i soldi", "il testo dice come viene pagata la spesa che propone?"],
  ["Di cosa parla", "a quale area appartiene, tra 14 possibili (tasse, sanità, scuola, lavoro…)?"],
  ["Quanto è su misura", "su una scala 0–3: da regola che vale per tutti (0) a somma precisa per un destinatario nominato (3)?"],
];

const DOMANDE_COPPIA = [
  ["Stesso risultato", "le due proposte cambiano la legge nello stesso modo — stesse regole, stessi soldi, stessi destinatari, stesse date?"],
  ["Stessa bozza", "sembrano uscite dallo stesso documento — stessa struttura e stesse frasi — anche se qualcuno ha cambiato cifre o destinatari?"],
  ["Cambia solo un numero", "l'unica differenza di sostanza è una cifra, una percentuale, un anno o una data?"],
];

function DomandeTable({ rows }: { rows: string[][] }) {
  return (
    <table className="tbl text-sm">
      <thead>
        <tr>
          <th>Domanda</th>
          <th>In parole povere</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([t, d]) => (
          <tr key={t}>
            <td className="font-semibold">{t}</td>
            <td className="text-(--color-ink-soft)">{d}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function MetodoPage() {
  const atto = getLatestAtto();
  const v = atto ? getValutazione(atto.attoId) : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Metodologia</p>
        <h1 className="display mt-1 text-4xl">Come è fatto</h1>
      </header>

      <Card title="In breve, in tre passi">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Scarichiamo dal sito della Camera il documento con tutti gli emendamenti
            depositati.
          </li>
          <li>
            Per ognuno facciamo sette domande al{" "}
            <Termine id="programma-di-lettura">programma di lettura</Termine>.
          </li>
          <li>Confrontiamo a coppie quelli che si somigliano.</li>
        </ol>
        <p className="mt-3">
          Tutto gira su un nostro computer; il sito mostra solo i risultati. Nessuna chiave o
          dato privato passa per il sito.
        </p>
      </Card>

      <Card title={DATI_USATI.titolo}>
        <div className="space-y-3">
          {DATI_USATI.paragrafi.map((p) => {
            const m = p.match(/^(Perché[^.]*\.)\s*(.*)$/s);
            return m ? (
              <p key={p.slice(0, 24)}>
                <strong>{m[1]}</strong> {m[2]}
              </p>
            ) : (
              <p key={p.slice(0, 24)}>{p}</p>
            );
          })}
        </div>
      </Card>

      <Card title="Le sette domande">
        <p className="mb-4 text-sm text-(--color-ink-soft)">
          Per ogni emendamento — il testo completo, chi lo firma e il suo partito — il
          programma risponde con una percentuale:
        </p>
        <div className="overflow-x-auto">
          <DomandeTable rows={DOMANDE_SINGOLO} />
        </div>
      </Card>

      <Card title="Le tre domande sulle coppie">
        <p className="mb-4 text-sm text-(--color-ink-soft)">
          Solo per le coppie con almeno il 35% di{" "}
          <Termine id="parole-in-comune">parole in comune</Termine>, o con testo identico:
        </p>
        <div className="overflow-x-auto">
          <DomandeTable rows={DOMANDE_COPPIA} />
        </div>
        <p className="mt-4 text-sm text-(--color-ink-soft)">
          Le domande sono in inglese nel codice perché il programma è addestrato soprattutto
          in inglese; i testi degli emendamenti gli vengono dati in italiano così come sono.
        </p>
      </Card>

      {v && (
        <Card title="Quanto ci si può fidare">
          <p className="mb-4">
            La prova del nove: gli uffici della Camera segnano da soli le coppie{" "}
            <Termine id="segnalato-identico">identiche</Termine> (la nota «ident.» nel
            documento ufficiale). Se su quelle coppie il programma risponde «stesso
            risultato», vuol dire che sta leggendo bene. Ecco com'è andata:
          </p>
          <div className="overflow-x-auto">
            <table className="tbl text-sm">
              <thead>
                <tr>
                  <th>Quali coppie</th>
                  <th className="num">Quante</th>
                  <th className="num">Sicurezza media «stesso risultato»</th>
                  <th className="num">Almeno 80%</th>
                  <th className="num">Almeno 50%</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Coppie che la Camera segna come identiche</td>
                  <td className="num">{fmtNum(v.coppie_ident_camera.n)}</td>
                  <td className="num">
                    {v.coppie_ident_camera.media != null ? pct(v.coppie_ident_camera.media) : "—"}
                  </td>
                  <td className="num">
                    {v.coppie_ident_camera.quota_ge_08 != null ? pct(v.coppie_ident_camera.quota_ge_08) : "—"}
                  </td>
                  <td className="num">
                    {v.coppie_ident_camera.quota_ge_05 != null ? pct(v.coppie_ident_camera.quota_ge_05) : "—"}
                  </td>
                </tr>
                <tr>
                  <td>Coppie con testo quasi uguale (≥ 90% di parole in comune)</td>
                  <td className="num">{fmtNum(v.coppie_jaccard_alto.n)}</td>
                  <td className="num">
                    {v.coppie_jaccard_alto.media != null ? pct(v.coppie_jaccard_alto.media) : "—"}
                  </td>
                  <td className="num">
                    {v.coppie_jaccard_alto.quota_ge_08 != null ? pct(v.coppie_jaccard_alto.quota_ge_08) : "—"}
                  </td>
                  <td className="num">
                    {v.coppie_jaccard_alto.quota_ge_05 != null ? pct(v.coppie_jaccard_alto.quota_ge_05) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {v.coppie_ident_camera.quota_ge_08 != null && (
            <p className="mt-4">
              Nella prima riga il programma è d'accordo con la Camera nel{" "}
              {pct(v.coppie_ident_camera.quota_ge_08)} dei casi (soglia 80%). Nella seconda
              riga la media è più bassa: molti testi quasi uguali cambiano proprio la cifra o
              il destinatario, e il programma li distingue.
            </p>
          )}
          <p className="mt-3 text-sm text-(--color-ink-soft)">
            Fotocopie esatte (stesso testo parola per parola, conteggio fatto senza il
            programma): {v.fotocopie_esatte.gruppi} gruppi,{" "}
            {fmtNum(v.fotocopie_esatte.emendamenti)} emendamenti.
          </p>
          {v.usage && (
            <p className="mt-2 text-sm text-(--color-ink-soft)">
              Leggere tutto è costato {fmtNum(v.usage.chiamate)} chiamate e ≈{" "}
              {v.usage.costo_stimato_usd.toFixed(2)} $ (tariffa{" "}
              {v.usage.tariffa_input_per_milione} $ per milione di token in ingresso). Una
              persona ci metterebbe settimane.
            </p>
          )}
        </Card>
      )}

      <Card title="Limiti">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Le risposte del programma sono percentuali, non verdetti. Un «82%» non dimostra la
            copia: è un indizio forte da verificare sul testo originale, sempre linkato.
          </li>
          <li>
            Le cifre in euro sono lette automaticamente dai testi: è una stima grezza delle
            richieste, non una previsione di spesa. Cifre scritte in lettere o formule
            indirette non vengono conteggiate.
          </li>
          <li>
            Le coppie con meno del 35% di parole in comune non vengono lette dal programma:
            una copia riscritta con parole molto diverse può sfuggire.
          </li>
          <li>
            Il partito di un emendamento è quello del primo firmatario nel giorno di
            pubblicazione: chi ha cambiato partito dopo appare con quello di allora.
          </li>
        </ul>
      </Card>

      <Card title="Cosa questo sito non dice">
        <ul className="list-disc space-y-2 pl-5">
          {COSA_NON_DICE.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
