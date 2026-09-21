import { getLatestAtto, getValutazione, pct } from "@/lib/data";
import { Termine } from "@/app/components";
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

export default function MetodoPage() {
  const atto = getLatestAtto();
  const v = atto ? getValutazione(atto.attoId) : null;

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="masthead-title text-3xl">Come è fatto</h1>
      </header>

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">In breve, in tre passi</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Scarichiamo dal sito della Camera il documento con tutti gli emendamenti depositati.
          </li>
          <li>
            Per ognuno facciamo sette domande al{" "}
            <Termine id="programma-di-lettura">programma di lettura</Termine>.
          </li>
          <li>Confrontiamo a coppie quelli che si somigliano.</li>
        </ol>
        <p>
          Tutto gira su un nostro computer; il sito mostra solo i risultati. Nessuna chiave o
          dato privato passa per il sito.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">{DATI_USATI.titolo}</h2>
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
      </section>

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">Le sette domande</h2>
        <p className="text-sm text-(--color-ink-soft)">
          Per ogni emendamento — il testo completo, chi lo firma e il suo partito — il programma
          risponde con una percentuale:
        </p>
        <ul className="list-none space-y-2 border-l border-(--color-line) pl-4">
          {DOMANDE_SINGOLO.map(([t, d]) => (
            <li key={t}>
              <strong>{t}</strong> — {d}
            </li>
          ))}
        </ul>
        <h2 className="masthead-title pt-4 text-2xl">Le tre domande sulle coppie</h2>
        <p className="text-sm text-(--color-ink-soft)">
          Solo per le coppie con almeno il 35% di{" "}
          <Termine id="parole-in-comune">parole in comune</Termine>, o con testo identico:
        </p>
        <ul className="list-none space-y-2 border-l border-(--color-line) pl-4">
          {DOMANDE_COPPIA.map(([t, d]) => (
            <li key={t}>
              <strong>{t}</strong> — {d}
            </li>
          ))}
        </ul>
        <p className="text-sm text-(--color-ink-soft)">
          Le domande sono in inglese nel codice perché il programma è addestrato soprattutto in
          inglese; i testi degli emendamenti gli vengono dati in italiano così come sono.
        </p>
      </section>

      {v && (
        <section className="space-y-3">
          <h2 className="masthead-title text-2xl">Quanto ci si può fidare</h2>
          <p>
            La prova del nove: gli uffici della Camera segnano da soli le coppie{" "}
            <Termine id="segnalato-identico">identiche</Termine> (la nota «ident.» nel documento
            ufficiale). Se su quelle coppie il programma risponde «stesso risultato», vuol dire
            che sta leggendo bene. Ecco com'è andata:
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="label border-b border-(--color-line) text-left">
                <th className="py-1 font-normal">Quali coppie</th>
                <th className="py-1 text-right font-normal">Quante</th>
                <th className="py-1 text-right font-normal">Sicurezza media «stesso risultato»</th>
                <th className="py-1 text-right font-normal">Almeno 80%</th>
                <th className="py-1 text-right font-normal">Almeno 50%</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-(--color-line)">
                <td className="py-1.5">Coppie che la Camera segna come identiche</td>
                <td className="num text-right">{v.coppie_ident_camera.n.toLocaleString("it-IT")}</td>
                <td className="num text-right">
                  {v.coppie_ident_camera.media != null ? pct(v.coppie_ident_camera.media) : "—"}
                </td>
                <td className="num text-right">
                  {v.coppie_ident_camera.quota_ge_08 != null ? pct(v.coppie_ident_camera.quota_ge_08) : "—"}
                </td>
                <td className="num text-right">
                  {v.coppie_ident_camera.quota_ge_05 != null ? pct(v.coppie_ident_camera.quota_ge_05) : "—"}
                </td>
              </tr>
              <tr className="border-b border-(--color-line)">
                <td className="py-1.5">Coppie con testo quasi uguale (≥ 90% di parole in comune)</td>
                <td className="num text-right">{v.coppie_jaccard_alto.n.toLocaleString("it-IT")}</td>
                <td className="num text-right">
                  {v.coppie_jaccard_alto.media != null ? pct(v.coppie_jaccard_alto.media) : "—"}
                </td>
                <td className="num text-right">
                  {v.coppie_jaccard_alto.quota_ge_08 != null ? pct(v.coppie_jaccard_alto.quota_ge_08) : "—"}
                </td>
                <td className="num text-right">
                  {v.coppie_jaccard_alto.quota_ge_05 != null ? pct(v.coppie_jaccard_alto.quota_ge_05) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
          {v.coppie_ident_camera.quota_ge_08 != null && (
            <p>
              Nella prima riga il programma è d'accordo con la Camera nel{" "}
              {pct(v.coppie_ident_camera.quota_ge_08)} dei casi (soglia 80%). Nella seconda riga
              la media è più bassa: molti testi quasi uguali cambiano proprio la cifra o il
              destinatario, e il programma li distingue.
            </p>
          )}
          <p className="text-sm text-(--color-ink-soft)">
            Fotocopie esatte (stesso testo parola per parola, conteggio fatto senza il
            programma): {v.fotocopie_esatte.gruppi} gruppi,{" "}
            {v.fotocopie_esatte.emendamenti.toLocaleString("it-IT")} emendamenti.
          </p>
          {v.usage && (
            <p className="text-sm text-(--color-ink-soft)">
              Leggere tutto è costato {v.usage.chiamate.toLocaleString("it-IT")} chiamate e ≈{" "}
              {v.usage.costo_stimato_usd.toFixed(2)} $ (tariffa{" "}
              {v.usage.tariffa_input_per_milione} $ per milione di token in ingresso). Una
              persona ci metterebbe settimane.
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">Limiti</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Le risposte del programma sono percentuali, non verdetti. Un «82%» non dimostra la
            copia: è un indizio forte da verificare sul testo originale, sempre linkato.
          </li>
          <li>
            Le cifre in euro sono lette automaticamente dai testi: è una stima grezza delle
            richieste, non una previsione di spesa. Cifre scritte in lettere o formule indirette
            non vengono conteggiate.
          </li>
          <li>
            Le coppie con meno del 35% di parole in comune non vengono lette dal programma: una
            copia riscritta con parole molto diverse può sfuggire.
          </li>
          <li>
            Il partito di un emendamento è quello del primo firmatario nel giorno di
            pubblicazione: chi ha cambiato partito dopo appare con quello di allora.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">Cosa questo sito non dice</h2>
        <ul className="list-disc space-y-2 pl-5">
          {COSA_NON_DICE.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
