# Dati per il riuso (`export/`)

Una cartella per atto: `export/<attoId>/`. Tutto è generato da `npm run pipeline:build` a partire dai file committati in `data/`, quindi rigenerabile senza rete e senza chiave.

Regola di separazione: quello che è **osservato** (testi, firme, esiti, annotazioni della Camera) e quello che è **calcolato in modo deterministico** (hash, gruppi di testo identico, conteggi) sta nella radice. Quello che è **prodotto dal modello** sta in `modello/` ed è sempre una probabilità, mai un fatto.

## `provenance.json`

```json
{
  "attoId": "2112-bis",
  "titolo": "Bilancio di previsione dello Stato per l'anno finanziario 2025 (A.C. 2112-bis)",
  "fonte": {
    "titolare": "Camera dei deputati",
    "xml": "https://documenti.camera.it/leg19/emendamenti/xml/leg.19.eme.ac.2112-bis.xml",
    "pagineEmendamento": "https://documenti.camera.it/apps/emendamenti/getPropostaEmendativa.aspx?...",
    "gruppiDeputati": "https://dati.camera.it/sparql",
    "sha256Xml": "<hash del container.xml scaricato>",
    "acquisitoIl": "<ISO 8601>"
  },
  "sedute": ["20241209", "…"],
  "conteggi": { "occorrenzeBollettino": 5992, "emendamentiUnici": 5082, "ripubblicazioni": 868 },
  "modello": {
    "fornitore": "TypeSafe",
    "nome": "Jev",
    "domandeSingole": ["articolo_aggiuntivo", "soppressivo", "…"],
    "domandeCoppia": ["stesso_effetto", "stessa_matrice", "differenza_solo_numerica"],
    "chiamate": 12206,
    "tokenInput": 20000000,
    "costoUsdStimato": 0.84,
    "definizioni": "pipeline/questions.ts"
  },
  "soglie": { "copiaRiscritta": 0.8, "mancetta": { "livello": 3, "probabilitaMinima": 0.5 }, "jaccardCandidati": "<valore usato>" },
  "generatoIl": "<ISO 8601>",
  "licenzaDatiDerivati": "CC-BY-4.0"
}
```

`sha256Xml` e `acquisitoIl` si leggono dal file `data/raw/<attoId>/container.xml` se presente in locale; se assente (non è committato), il campo vale `null` e `acquisitoIl` prende la data di `data/raw/<attoId>/emendamenti.json`.

## `emendamenti.jsonl` — un emendamento unico per riga

Solo dati osservati più due campi deterministici (`testoHash`, `importoEuroEstratto`).

| Campo | Tipo | Note |
| --- | --- | --- |
| `key` | string | Chiave stabile `"<seduta>:<numero>"`, es. `"20241217:97.26."`. È la chiave usata da tutti gli altri file |
| `id` | string | Numero dell'emendamento come pubblicato, es. `"97.26."` |
| `numeroPubblicato` | string | Numero originale nel bollettino (può differire per le riformulazioni) |
| `articolo` | string | Articolo del disegno di legge a cui si riferisce |
| `testo` | string | Testo integrale come pubblicato |
| `testoHash` | string | SHA-1 di `normaliseText(testo)` (minuscole, sola lettera/cifra, spazi singoli). Due emendamenti con lo stesso hash sono «identici parola per parola» |
| `firmatari` | `{nome, idPersona, tipo}[]` | In ordine di firma. `idPersona` è l'id di `dati.camera.it` (vuoto per i proponenti collegiali). `tipo` è il `tipoProponente` della Camera |
| `primoFirmatario` | `{nome, idPersona, tipo}` \| null | `firmatari[0]` |
| `tipoProponente` | string | Tipo del primo firmatario: `deputato` / `governo` / `relatori` / `relatore` / `organo`. Governo e relatori non hanno nome nel documento della Camera: compaiono come «Governo» e «Relatori» |
| `gruppi` | string[] | Sigle dei gruppi di tutti i firmatari al giorno della seduta, deduplicate |
| `gruppo` | string | Gruppo del primo firmatario |
| `esito` | string \| null | Come pubblicato dalla Camera, normalizzato in `approvato` / `inammissibile` / `respinto` / `ritirato` / … / null |
| `esitoAnnotazione` | string \| null | Nota testuale della Camera accanto all'esito, se presente |
| `nuovaFormulazione` | boolean | L'emendamento è una riformulazione |
| `riformulaDi` | string \| null | `key` dell'emendamento riformulato |
| `identTo` | string[] | Numeri che la Camera stessa annota come «identico a» |
| `seduta` | string | Prima seduta di pubblicazione, `YYYYMMDD` |
| `sedute` | string[] | Tutte le sedute in cui è stato ripubblicato |
| `sourceUrl` | string | Pagina ufficiale dell'emendamento su `documenti.camera.it` |
| `importoEuroEstratto` | number \| null | Importo massimo trovato nel testo da regex, esclusa la clausola di copertura, ignorati i valori sopra 50 mld. Euristico: usare solo come ordine di grandezza |

## `fotocopie_esatte.json` — gruppi di testo identico

Array di gruppi, uno per `testoHash` con almeno 2 emendamenti. Ordinato per `n` decrescente.

| Campo | Tipo | Note |
| --- | --- | --- |
| `testoHash` | string | Identificatore del gruppo |
| `n` | number | Quanti emendamenti unici hanno questo testo |
| `emendamenti` | string[] | Le `key` |
| `gruppiParlamentari` | string[] | Gruppi dei primi firmatari, deduplicati |
| `traGruppiDiversi` | boolean | `gruppiParlamentari.length > 1` |
| `annotatoDallaCamera` | boolean | Almeno una coppia del gruppo compare in `identTo` |
| `testo` | string | Il testo (del primo emendamento del gruppo in ordine di `key`) |

Conteggi attesi per 2112-bis: 459 gruppi, 1.293 emendamenti coinvolti, 1.259 con `traGruppiDiversi` tra gruppi diversi e 34 nello stesso gruppo (calcolati sui singoli emendamenti: un emendamento è «tra gruppi diversi» se nel suo gruppo c'è almeno un primo firmatario di un altro gruppo).

## `per_deputato.jsonl` — un primo firmatario per riga

Solo conteggi deterministici. Nessuna uscita del modello.

| Campo | Tipo | Note |
| --- | --- | --- |
| `idPersona` | string | Id `dati.camera.it` |
| `nome` | string | |
| `gruppo` | string | Gruppo prevalente tra i suoi emendamenti (in caso di cambio gruppo durante l'esame) |
| `depositati` | number | Emendamenti unici a sua prima firma |
| `identiciAdAltro` | number | Di questi, quanti hanno `testoHash` condiviso con almeno un emendamento a prima firma di **un'altra persona** |
| `identiciAdAltroGruppo` | number | Di questi, quanti condivisi con un primo firmatario di un **altro gruppo** |
| `approvati` | number | Con `esito = approvato` |

Include tutti i deputati con `depositati ≥ 1` (non solo i 40 mostrati nel sito). I proponenti collegiali (Governo, relatori, organi), che non hanno `idPersona`, sono esclusi: questo file riguarda solo persone fisiche.

## `per_gruppo.json`

Oggetto `sigla → { n, approvati, inammissibili, senzaEsito, identiciAdAltro, identiciAdAltroGruppo }` più `matrice`: `sigla → sigla → numero di coppie di emendamenti identici` (stessa struttura di `public/data/<attoId>/gruppi_matrix.json`, ma **contando solo le fotocopie esatte**, senza soglia del modello). La diagonale conta le coppie dentro lo stesso gruppo.

## `modello/letture.jsonl` — una riga per emendamento letto dal modello

| Campo | Tipo | Note |
| --- | --- | --- |
| `key` | string | |
| `testoHash` | string | Se il testo cambia, la lettura va rifatta: la cache è per `key + testoHash` |
| `articolo_aggiuntivo` | number 0–1 | Probabilità che aggiunga un articolo/comma nuovo |
| `soppressivo` | number 0–1 | Probabilità che sopprima testo |
| `localistico` | number 0–1 | Probabilità che riguardi un luogo, ente, evento o soggetto nominato |
| `beneficiario_identificabile` | number 0–1 | |
| `copertura_indicata` | number 0–1 | Il testo dice da dove vengono i soldi |
| `ambito` | `{choice, probabilities, confidence}` | Ambito tematico scelto tra le opzioni in `pipeline/questions.ts` |
| `micro_intervento` | `{score, probabilities, confidence}` | Scala 0–3 «su misura». Nel sito è «mancetta» se `score = 3` con `probabilities["3"] ≥ 0.5` |

## `modello/coppie.jsonl` — una riga per coppia letta dal modello

Le coppie sono quelle sopra la soglia Jaccard oppure annotate dalla Camera. Le fotocopie esatte sono incluse per taratura ma **non** servono al modello per essere riconosciute.

| Campo | Tipo | Note |
| --- | --- | --- |
| `a`, `b` | string | `key` dei due emendamenti, `a < b` in ordine lessicografico |
| `esatta` | boolean | Stesso `testoHash` (deterministico) |
| `identMarkedByCamera` | boolean | La Camera annota l'una come identica all'altra |
| `jaccard` | number 0–1 | Similarità sui token, deterministica |
| `stesso_effetto` | number 0–1 | Probabilità che producano lo stesso risultato pratico |
| `stessa_matrice` | number 0–1 | Probabilità che partano dalla stessa bozza |
| `differenza_solo_numerica` | number 0–1 | Probabilità che l'unica differenza sostanziale sia una cifra/data/percentuale |

## Come leggere i numeri del modello

- Sono probabilità calibrate su domande chiuse, non classificazioni certe. Un `stesso_effetto = 0.91` va letto come «il modello è sicuro al 91%», non come «è identico».
- Taratura disponibile: sulle coppie con `identMarkedByCamera = true`, distribuzione di `stesso_effetto` in `public/data/<attoId>/valutazione.json`.
- Non usarli per affermazioni su singole persone. Le uniche affermazioni nominative che i dati reggono sono quelle in `per_deputato.jsonl`, e dicono che un testo è identico a un altro, non chi lo ha scritto.

## Riproducibilità

```bash
npm run pipeline:build -- --atto 2112-bis
```

Rigenera `public/data/` ed `export/` dai file in `data/`. Nessuna chiamata di rete, nessuna chiave. I file `.jsonl` sono ordinati per `key` (o `a`,`b`), così il diff tra due generazioni è leggibile.
