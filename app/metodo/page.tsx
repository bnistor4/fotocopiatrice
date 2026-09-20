import { getLatestAtto, getValutazione, pct } from "@/lib/data";

const DOMANDE_SINGOLO = [
  ["Articolo aggiuntivo", "aggiunge disposizioni nuove (articolo o commi inediti) invece di modificare o sopprimere testo esistente?"],
  ["Soppressivo", "sopprime testo del disegno di legge (comma, articolo, parole)?"],
  ["Localistico", "destina soldi, benefici o deroghe a un territorio specifico o a un ente, fondazione, evento, azienda nominati?"],
  ["Beneficiario identificabile", "un lettore può capire concretamente chi ci guadagna — un ente nominato o un gruppo molto ristretto?"],
  ["Copertura indicata", "il testo dice come viene finanziata la spesa (riduzioni di altri fondi, Fondo esigenze indifferibili, ecc.)?"],
  ["Ambito", "a quale area di politica pubblica appartiene (fisco, sanità, scuola, infrastrutture…)? — risposta a scelta multipla"],
  ["Micro-intervento", "su una scala 0–3: da regola generale per tutti a «mancetta» — una somma specifica per un ente, evento o progetto nominato"],
];

const DOMANDE_COPPIA = [
  ["Stesso effetto", "le due proposte cambiano la legge nello stesso modo — stessa disposizione, beneficiari, importi, date e percentuali?"],
  ["Stessa matrice", "sembrano uscite dalla stessa bozza — stessa struttura, stesse clausole, stesse formule — anche se importi o beneficiari sono stati ritoccati?"],
  ["Differenza solo numerica", "l'unica differenza sostanziale è un numero (importo, percentuale, anno, data)?"],
];

export default function MetodoPage() {
  const atto = getLatestAtto();
  const v = atto ? getValutazione(atto.attoId) : null;

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="masthead-title text-3xl">Come funziona</h1>
      </header>

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">La macchina</h2>
        <p>
          La pipeline gira <strong>in locale</strong>, non sul sito: uno script scarica gli
          emendamenti pubblicati dalla Camera dei deputati (documenti.camera.it), un secondo
          script li sottopone a <strong>Jev</strong>, il modello «System One» di TypeSafe — un
          modello che non scrive testo ma risponde a domande precise restituendo{" "}
          <em>probabilità tipizzate</em>. Un terzo script confronta le coppie di emendamenti.
          I risultati vengono salvati in file JSON che questo sito si limita a leggere:{" "}
          <strong>nessuna chiave API vive su Vercel</strong>.
        </p>
        <p>
          Il bollettino ripubblica lo stesso emendamento in più sedute (i «segnalati»):
          le righe con stesso numero, stesso testo e stessi firmatari vengono contate{" "}
          <strong>una sola volta</strong>; le riformulazioni (stesso numero, testo diverso)
          restano schede distinte ma non sono mai conteggiate come fotocopie.
        </p>
        <p>
          Il gruppo parlamentare dei firmatari viene ricostruito dal grafo open data della
          Camera (dati.camera.it, SPARQL), alla data della seduta in cui l'emendamento è stato
          pubblicato.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">Le domande poste al modello</h2>
        <p className="text-sm text-(--color-ink-soft)">
          Per ogni emendamento (testo completo, articolo, firmatari e gruppi nello «stato»):
        </p>
        <ul className="list-none space-y-2 border-l border-(--color-line) pl-4">
          {DOMANDE_SINGOLO.map(([t, d]) => (
            <li key={t}>
              <strong>{t}</strong> — {d}
            </li>
          ))}
        </ul>
        <p className="text-sm text-(--color-ink-soft)">
          Per ogni coppia candidata (similarità Jaccard sul testo ≥ 0,35, oppure testo
          identico):
        </p>
        <ul className="list-none space-y-2 border-l border-(--color-line) pl-4">
          {DOMANDE_COPPIA.map(([t, d]) => (
            <li key={t}>
              <strong>{t}</strong> — {d}
            </li>
          ))}
        </ul>
      </section>

      {v && (
        <section className="space-y-3">
          <h2 className="masthead-title text-2xl">Quanto ci si può fidare</h2>
          <p>
            La Camera stessa marca come «identici» gli emendamenti presentati identici da più
            firmatari (la nota «ident.» nel bollettino). Usiamo quella marcatura come verità di
            controllo:
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="label border-b border-(--color-line) text-left">
                <th className="py-1 font-normal">Campionato</th>
                <th className="py-1 text-right font-normal">Coppie</th>
                <th className="py-1 text-right font-normal">Media «stesso effetto»</th>
                <th className="py-1 text-right font-normal">Quota ≥ 80%</th>
                <th className="py-1 text-right font-normal">Quota ≥ 50%</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-(--color-line)">
                <td className="py-1.5">Coppie segnate «ident.» dalla Camera</td>
                <td className="num text-right">{v.coppie_ident_camera.n}</td>
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
                <td className="py-1.5">Coppie con testo quasi identico (Jaccard ≥ 0,9)</td>
                <td className="num text-right">{v.coppie_jaccard_alto.n}</td>
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
          <p className="text-sm text-(--color-ink-soft)">
            Fotocopie esatte (testo identico dopo normalizzazione, calcolato in codice senza il
            modello): {v.fotocopie_esatte.gruppi} gruppi, {v.fotocopie_esatte.emendamenti}{" "}
            emendamenti.
          </p>
          {v.usage && (
            <p className="text-sm text-(--color-ink-soft)">
              Costo dell'analisi finora: {v.usage.chiamate} chiamate,{" "}
              {v.usage.input_tokens.toLocaleString("it-IT")} token in ingresso, ≈{" "}
              {v.usage.costo_stimato_usd.toFixed(3)} $ (tariffa {v.usage.tariffa_input_per_milione}{" "}
              $/Milione di token in input).
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="masthead-title text-2xl">Limiti</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Le risposte sono <strong>probabilità, non verdetti</strong>. Un «82%» di stesso
            effetto non dimostra la copia: va letto come un indizio forte da verificare sul
            testo (ogni scheda riporta il link alla fonte ufficiale).
          </li>
          <li>
            Gli importi in euro sono estratti con espressioni regolari dal testo, tagliando la
            clausola di copertura e ignorando cifre oltre 50 miliardi: è una stima grezza degli
            importi massimi citati, calcolata solo sugli emendamenti analizzati e non
            soppressivi. Cifre in lettere o formule indirette non vengono conteggiate.
          </li>
          <li>
            Le coppie oltre la soglia di similarità Jaccard non vengono mostrate al modello:
            copie molto riformulate possono sfuggire.
          </li>
          <li>
            Il gruppo associato a un emendamento è quello del primo firmatario alla data della
            seduta; chi ha cambiato gruppo appare con il gruppo di allora.
          </li>
        </ul>
      </section>
    </div>
  );
}
