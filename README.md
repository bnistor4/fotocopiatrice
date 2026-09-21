# Fotocopiatrice

Legge tutti gli emendamenti depositati alla Camera su una legge, trova quelli identici o equivalenti tra loro, e mostra chi li ha firmati. Scritto per chi non sa cosa sia un emendamento.

**Sito:** [fotocopiatrice.vercel.app](https://fotocopiatrice.vercel.app/)

Primo atto analizzato: legge di bilancio 2025 (A.C. 2112-bis), Commissione Bilancio della Camera.

| | |
| --- | --- |
| Emendamenti unici | 5.082 (5.992 pubblicazioni nel bollettino, 868 ripubblicazioni) |
| Identici parola per parola a un altro | 1.293 (25%), in 459 gruppi; 1.259 tra gruppi parlamentari diversi |
| Riscritti ma equivalenti (secondo il modello, soglia 80%) | 44 |
| Approvati / inammissibili / senza esito pubblicato | 347 / 1.190 / 3.545 |
| Costo dell'analisi automatica | 12.206 chiamate, ~20 M token, 0,84 $ |

## Cosa contiene il repository

- `pipeline/` — scarica i dati dalla Camera, li deduplica, li fa leggere al modello, aggrega. Gira in locale, richiede una chiave TypeSafe solo per `analyze` e `pairs`.
- `data/` — dati grezzi e cache delle risposte del modello, committati. La pipeline è riproducibile senza rifare le chiamate.
- `public/data/` — i JSON che alimentano il sito.
- `export/` — **i dati pronti per il riuso da parte di terzi**, con schema documentato in [DATI.md](DATI.md). La parte deterministica (testi, firme, esiti, gruppi di testo identico) è separata da quella prodotta dal modello.
- `app/` — sito Next.js statico. Nessuna chiave sul server: legge solo JSON committati.

## Dati: cosa c'è, da dove viene, cosa non dimostra

**Fonte unica**: il documento XML con cui la Camera pubblica gli emendamenti depositati in Commissione (`documenti.camera.it/leg19/emendamenti/xml/leg.19.eme.ac.2112-bis.xml`). Contiene testo integrale, numero, articolo, firmatari, note degli uffici (incluse le annotazioni «identico a») ed esito quando pubblicato. Il gruppo parlamentare di ogni firmatario viene da `dati.camera.it` (SPARQL), al giorno della pubblicazione dell'emendamento.

**Calcolato in codice, senza modello**:
- deduplicazione delle ripubblicazioni (stesso numero, stesso testo normalizzato, stessi firmatari in sedute successive);
- gruppi di testo identico: SHA-1 del testo dopo `lowercase`, rimozione di punteggiatura e spazi multipli (`pipeline/lib.ts`, `normaliseText`);
- candidati alla lettura a coppie: similarità di Jaccard sui token.

**Calcolato dal modello** (TypeSafe Jev, domande chiuse con risposta in probabilità, `pipeline/questions.ts`):
- per ogni emendamento: aggiunge un articolo, sopprime testo, riguarda un luogo o ente nominato, il beneficiario è identificabile, indica la copertura, ambito tematico, quanto è «su misura» (scala 0–3);
- per ogni coppia candidata: stesso risultato, stessa bozza di partenza, differenza solo numerica.

Le uscite del modello sono probabilità, non fatti. Sulle 1.460 coppie che la Camera stessa annota come identiche, il modello dà «stesso risultato» medio 0,91 (92% sopra 0,8): è il controllo di taratura, riportato in `public/data/2112-bis/valutazione.json`.

**Cosa il sito non dice, e i dati non dimostrano**: che un deputato abbia copiato un altro (nella maggior parte dei casi entrambi hanno ricevuto lo stesso testo dalla stessa fonte); che copiare sia illegale; che un intervento «su misura» sia immeritato; chi ha scritto il testo originale. La «stima euro» somma gli importi massimi citati nei testi, esclusa la clausola di copertura: misura la dimensione delle richieste, non una spesa.

## Riuso

I dati in `export/` sono pensati per essere integrati altrove (per esempio in [DoveVannoINostriSoldi](https://github.com/Italian-Builders-Org/DoveVannoINostriSoldi), sezione `/politici`): file separati per dato osservato e dato derivato dal modello, chiavi stabili, `provenance.json` con URL, data di acquisizione, hash e versione del modello. Schema completo in [DATI.md](DATI.md).

Licenze: codice MIT ([LICENSE](LICENSE)); dati derivati CC BY 4.0 ([LICENSE-DATI](LICENSE-DATI)). I dati della Camera restano sotto le condizioni pubblicate dalla Camera dei deputati.

## Avvio

```bash
npm ci
npm run dev            # sito su http://localhost:3000, usa i JSON committati
```

Rigenerare i dati (serve `TYPESAFE_API_KEY` in `.env.local`, solo in locale):

```bash
npm run pipeline:scrape    # scarica XML + gruppi dei deputati
npm run pipeline:analyze   # 7 domande per emendamento, cache per id + hash del testo
npm run pipeline:pairs     # fotocopie esatte in codice, poi 3 domande per coppia candidata
npm run pipeline:build     # aggrega in public/data/ ed export/
```

Ogni passo è idempotente: rilanciato più avanti, manda al modello solo emendamenti nuovi o modificati.

Aggiungere un altro atto: `npm run pipeline:scrape -- --atto <numero>`, poi gli altri passi con `--atto`.

## Deploy

Sito statico su Vercel (https://fotocopiatrice.vercel.app/): nessuna variabile d'ambiente necessaria. `public/data/2112-bis/emendamenti.json` è 18 MB; va spezzato per pagina prima di aggiungere un secondo atto.
