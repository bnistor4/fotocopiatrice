// Tutti i testi esplicativi del sito, scritti per un lettore che non conosce
// il Parlamento né l'informatica. Regola: ogni parola tecnica ha una voce qui
// e le pagine la linkano con <Termine id="..."/>.

export type Voce = {
  id: string;
  titolo: string;
  breve: string; // una riga, usata nei tooltip e nelle didascalie
  spiegazione: string; // 2-5 frasi, usata nel glossario
  perche?: string; // perché conta per il cittadino (evidenziato)
};

export const GLOSSARIO: Voce[] = [
  {
    id: "legge-di-bilancio",
    titolo: "Legge di bilancio (la «manovra»)",
    breve: "La legge con cui lo Stato decide come spendere i soldi pubblici l'anno prossimo.",
    spiegazione:
      "Ogni autunno il Governo scrive un testo che dice quanto lo Stato incasserà e come spenderà i soldi nell'anno successivo: pensioni, sanità, scuola, tasse, bonus. Il Parlamento deve approvarlo entro il 31 dicembre, altrimenti lo Stato non può spendere. Per questo si lavora di corsa e con molte pressioni.",
    perche:
      "Sono i tuoi soldi: le tasse che paghi e i servizi che ricevi passano tutti da qui.",
  },
  {
    id: "emendamento",
    titolo: "Emendamento",
    breve: "Una proposta di modifica al testo della legge, presentata da uno o più deputati.",
    spiegazione:
      "Prima del voto finale, ogni deputato può proporre di cambiare la legge: aggiungere un pezzo, toglierne uno, cambiare una cifra. Ogni proposta si chiama emendamento, ha un numero e i nomi di chi la firma. Su questa legge ne sono stati depositati 5.085. Ne vengono discussi e votati solo alcune centinaia: gli altri vengono dichiarati inammissibili, ritirati, oppure decadono perché il Governo fa approvare un unico testo finale.",
    perche:
      "Ogni emendamento è una richiesta di spendere, o di non spendere, denaro pubblico. Leggerli dice cosa chiedono davvero i partiti, al di là dei comunicati.",
  },
  {
    id: "commissione-bilancio",
    titolo: "Commissione Bilancio",
    breve: "Il gruppo ristretto di deputati che esamina la legge prima che arrivi in Aula.",
    spiegazione:
      "La Camera ha 630 deputati, troppi per lavorare insieme su un testo di centinaia di pagine. Il grosso del lavoro si fa in una commissione di circa 45 deputati. È lì che vengono depositati quasi tutti gli emendamenti, ed è lì che abbiamo guardato.",
  },
  {
    id: "gruppo-parlamentare",
    titolo: "Gruppo parlamentare",
    breve: "Il «partito» dentro la Camera. Ogni deputato appartiene a un gruppo.",
    spiegazione:
      "Alla Camera i deputati si organizzano in gruppi, che quasi sempre coincidono con i partiti. Nel sito il gruppo di un emendamento è quello del primo firmatario, nel giorno in cui l'emendamento è stato pubblicato. Chi ha cambiato partito dopo appare con il gruppo di allora.",
  },
  {
    id: "primo-firmatario",
    titolo: "Primo firmatario",
    breve: "Il deputato il cui nome compare per primo: di solito chi ha scritto o promosso la proposta.",
    spiegazione:
      "Un emendamento può essere firmato da uno o da decine di deputati. Il primo nome è quello che conta politicamente: è a lui o lei che viene attribuita la proposta.",
  },
  {
    id: "fotocopia-esatta",
    titolo: "Fotocopia esatta",
    breve: "Due emendamenti con lo stesso testo parola per parola, firmati da deputati diversi.",
    spiegazione:
      "Confrontiamo i testi ignorando solo maiuscole, spazi e punteggiatura. Se sono identici, sono una fotocopia. Questo controllo lo fa un programma normale, senza intelligenza artificiale: non c'è margine di errore. Succede spesso perché associazioni, categorie e lobby scrivono un testo e lo consegnano a più deputati di partiti diversi, che lo depositano tale e quale. Oppure perché lo stesso partito lo deposita più volte con firme diverse.",
    perche:
      "Non è illegale né vietato. Ma quando 1 emendamento su 4 è una fotocopia, vuol dire che una parte grossa del lavoro parlamentare è ripetizione, e che chi scrive i testi spesso non è il deputato che li firma.",
  },
  {
    id: "copia-riscritta",
    titolo: "Copia riscritta (o «copia semantica»)",
    breve: "Due emendamenti scritti in modo diverso che ottengono lo stesso risultato.",
    spiegazione:
      "Qui il confronto parola per parola non basta: le frasi sono diverse, ma il risultato pratico è lo stesso (stessi soldi, stessi beneficiari, stesse date). Per riconoscerle serve leggere e capire il testo. È il lavoro che abbiamo affidato al programma di lettura automatica, che risponde con una percentuale. Contiamo come copia riscritta le coppie in cui il programma dà almeno l'80% di probabilità di «stesso risultato», escluse le fotocopie esatte.",
  },
  {
    id: "stesso-risultato",
    titolo: "Stesso risultato",
    breve: "I due testi cambiano la legge nello stesso modo: stesse regole, stessi soldi, stessi destinatari, stesse date.",
    spiegazione:
      "È la domanda più severa che facciamo al programma. Se due emendamenti hanno lo stesso risultato, approvarne uno o l'altro non cambia nulla per il cittadino.",
  },
  {
    id: "stessa-bozza",
    titolo: "Stessa bozza",
    breve: "I due testi sembrano partire dallo stesso documento, anche se qualcuno ha cambiato una cifra o un destinatario.",
    spiegazione:
      "Stessa struttura, stesse frasi fatte, stesse clausole, ma con i numeri ritoccati: 10 milioni invece di 5, la Regione X invece della Regione Y. Indica che i testi hanno un'origine comune anche se il risultato è diverso.",
    perche:
      "Rivela le «catene di montaggio»: un modello di emendamento che viene riciclato cambiando solo il beneficiario o l'importo.",
  },
  {
    id: "solo-un-numero",
    titolo: "Cambia solo un numero",
    breve: "L'unica differenza di sostanza tra i due testi è una cifra, una percentuale, un anno o una data.",
    spiegazione:
      "Un caso particolare di stessa bozza: tutto uguale tranne il numero. Spesso è una tattica: si deposita lo stesso emendamento con 5, 10 e 20 milioni per «tenere aperte» più opzioni durante la trattativa.",
  },
  {
    id: "articolo-aggiuntivo",
    titolo: "Articolo aggiuntivo",
    breve: "Un emendamento che non modifica quello che c'è già, ma aggiunge una cosa nuova.",
    spiegazione:
      "La legge di bilancio è divisa in articoli. Un emendamento può cambiare un articolo esistente oppure aggiungerne uno nuovo, su un tema che il Governo non aveva toccato. Su questa legge 3 emendamenti su 4 sono aggiuntivi.",
    perche:
      "La manovra viene usata come un treno su cui caricare di tutto, perché è l'unica legge che deve passare per forza entro l'anno. È il motivo per cui ogni anno diventa un testo enorme e illeggibile.",
  },
  {
    id: "soppressivo",
    titolo: "Soppressivo",
    breve: "Un emendamento che chiede di cancellare una parte del testo.",
    spiegazione:
      "L'opposto dell'aggiuntivo: propone di togliere un articolo, un comma o alcune parole. Sono tipici dell'opposizione, che così esprime il proprio dissenso su una misura del Governo.",
  },
  {
    id: "territorio-preciso",
    titolo: "Per un territorio o un ente preciso («localistico»)",
    breve: "L'emendamento destina soldi o vantaggi a un luogo, un ente, un evento o un'azienda nominati per nome.",
    spiegazione:
      "Una legge dello Stato di solito fissa regole per tutti. Un emendamento «localistico» invece dice: soldi a questo Comune, a questa fondazione, a questa manifestazione, a questa strada. Non è per forza sbagliato (a volte serve davvero), ma è il segno che un deputato sta portando qualcosa al proprio territorio.",
    perche:
      "È il modo più diretto per vedere se un deputato lavora per il Paese o per il proprio collegio.",
  },
  {
    id: "su-misura",
    titolo: "Su misura",
    breve: "L'emendamento riguarda una cerchia ristretta e riconoscibile, non tutti i cittadini.",
    spiegazione:
      "Abbiamo chiesto al programma di collocare ogni emendamento su una scala da 0 a 3: 0 è una regola generale che vale per tutti, 3 è una somma precisa per un destinatario nominato. Chiamiamo «su misura» gli emendamenti che con buona probabilità stanno a 2 o 3.",
  },
  {
    id: "mancetta",
    titolo: "Mancetta",
    breve: "Una somma precisa di denaro pubblico destinata a un ente, un evento o un luogo nominato: «2 milioni al Comune di X per il festival Y».",
    spiegazione:
      "È il termine che usano i giornalisti parlamentari, e lo teniamo perché è chiaro. Nel sito è una mancetta l'emendamento che il programma colloca al livello più alto (3) della scala «su misura» con almeno il 50% di probabilità. Il fatto che sia una mancetta non dice se è meritata o meno: dice che è un intervento puntuale, non una regola.",
    perche:
      "Le mancette sono il modo in cui una parte dei soldi della manovra si distribuisce per canali politici invece che per criteri uguali per tutti.",
  },
  {
    id: "copertura",
    titolo: "Copertura finanziaria",
    breve: "La frase che dice da dove si prendono i soldi per pagare quello che l'emendamento propone.",
    spiegazione:
      "La Costituzione obbliga chi propone una spesa a dire come la paga. Nella pratica quasi tutti gli emendamenti scrivono «si provvede mediante riduzione del Fondo per le esigenze indifferibili» o formule simili: un salvadanaio generico che serve da copertura di comodo. Un emendamento senza copertura viene di norma dichiarato inammissibile.",
  },
  {
    id: "esito",
    titolo: "Esito",
    breve: "Che fine ha fatto l'emendamento: approvato, dichiarato inammissibile, oppure nessuna indicazione.",
    spiegazione:
      "«Approvato» significa che è entrato nella legge. «Inammissibile» significa che è stato scartato prima ancora del voto, perché fuori tema o senza copertura. «Nessun esito pubblicato» è la voce più numerosa: la Camera non ha scritto nulla accanto a quell'emendamento nel documento ufficiale. Nella pratica, la maggior parte di questi non è mai stata votata: è decaduta quando il Governo ha fatto approvare il testo finale.",
    perche:
      "Su 5.085 proposte, 347 sono diventate legge. Le altre 4.700 sono servite a fare pressione, a farsi vedere dal proprio elettorato, o a nulla.",
  },
  {
    id: "inammissibile",
    titolo: "Inammissibile",
    breve: "Scartato prima del voto dal presidente della commissione, perché fuori tema o senza copertura.",
    spiegazione:
      "Non è un giudizio politico ma un filtro tecnico: la legge di bilancio può contenere solo certe cose, e ogni spesa deve avere una copertura. Chi presenta un emendamento inammissibile spesso lo sa già: lo deposita per far vedere di averlo proposto.",
  },
  {
    id: "ripubblicato",
    titolo: "Ripubblicato",
    breve: "Lo stesso emendamento compare nel documento ufficiale in più giornate di lavoro.",
    spiegazione:
      "La Camera pubblica un elenco a ogni seduta, e un emendamento ancora in discussione viene ristampato. Nel sito lo contiamo una volta sola: se non lo facessimo, le fotocopie sembrerebbero il doppio di quelle vere.",
  },
  {
    id: "riformulazione",
    titolo: "Riformulazione (o «nuova formulazione»)",
    breve: "Lo stesso emendamento, riscritto dai suoi firmatari, spesso dopo una trattativa con il Governo.",
    spiegazione:
      "Mantiene lo stesso numero ma il testo cambia. Nel sito la teniamo come scheda separata e collegata all'originale, e non la contiamo mai come fotocopia.",
  },
  {
    id: "segnalato-identico",
    titolo: "«Identico» secondo la Camera",
    breve: "Gli uffici della Camera stessi annotano quando un emendamento è uguale a un altro.",
    spiegazione:
      "Nel documento ufficiale accanto ad alcuni emendamenti compare la nota «ident.» seguita da altri numeri. Sono coppie che gli uffici hanno riconosciuto come identiche. Le usiamo come prova del nove: se il nostro programma dice «stesso risultato» quando la Camera dice «identico», sta leggendo bene.",
  },
  {
    id: "programma-di-lettura",
    titolo: "Il programma di lettura (Jev)",
    breve: "Un'intelligenza artificiale che legge un testo e risponde a domande chiuse con una percentuale. Non scrive, non inventa.",
    spiegazione:
      "Si chiama Jev ed è fatto dall'azienda TypeSafe. A differenza dei chatbot, non produce frasi: gli si dà un testo e una domanda tipo «questo emendamento aggiunge un articolo nuovo?», e lui risponde «sì al 91%». Lo abbiamo scelto perché è pensato per questo tipo di lavoro, è veloce e costa pochissimo: leggere tutti i 5.085 emendamenti e confrontare 5.125 coppie è costato meno di un euro. Una persona ci metterebbe settimane.",
    perche:
      "Fino a ieri nessuno leggeva tutti gli emendamenti: né i giornalisti, né i cittadini, spesso nemmeno i deputati. Adesso costa 84 centesimi.",
  },
  {
    id: "probabilita",
    titolo: "Probabilità (le percentuali)",
    breve: "Quanto il programma è sicuro della sua risposta. 82% vuol dire: molto probabile, ma non certo.",
    spiegazione:
      "Il programma non risponde sì o no: risponde con un numero da 0 a 100. Un 95% va letto come «quasi sicuramente sì», un 50% come «non saprei», un 10% come «quasi sicuramente no». Quando nel sito diciamo «copia riscritta» o «mancetta», stiamo applicando una soglia (80% o 50%) a queste percentuali. Le soglie sono scritte accanto a ogni numero.",
    perche:
      "Nessun numero di questo sito è una prova. È un indizio forte che ti dice dove guardare: il testo originale è sempre a un clic, sul sito della Camera.",
  },
  {
    id: "parole-in-comune",
    titolo: "Parole in comune",
    breve: "Quanta parte delle parole di due testi è uguale, in percentuale. Serve a decidere quali coppie far leggere al programma.",
    spiegazione:
      "Confrontare tutti i 5.085 emendamenti tra loro farebbe 13 milioni di coppie. Prima facciamo un conto veloce: quante parole hanno in comune? Solo le coppie con almeno il 35% di parole in comune (o testo identico) vengono lette dal programma. Il prezzo è che una copia riscritta con parole molto diverse può sfuggirci.",
  },
  {
    id: "euro-richiesti",
    titolo: "Euro richiesti (stima grezza)",
    breve: "La somma delle cifre più alte scritte nei testi degli emendamenti. Non è quanto si spenderebbe davvero.",
    spiegazione:
      "Un programma cerca nei testi frasi come «10 milioni di euro» e prende la cifra più alta di ogni emendamento, ignorando la parte in cui si dice da dove vengono i soldi. Poi somma. Il totale è enorme perché molti emendamenti si sovrappongono, alcuni chiedono la stessa cosa con cifre diverse, e alcuni riscrivono fondi da miliardi già esistenti. Non è denaro sprecato né denaro speso: è la misura di quanto grandi sono le richieste messe sul tavolo.",
    perche:
      "Per capirne la scala: la manovra intera vale circa 30 miliardi di misure nuove. Le richieste nei soli emendamenti superano di gran lunga quella cifra.",
  },
  {
    id: "ambito",
    titolo: "Ambito (di cosa parla)",
    breve: "L'area della vita pubblica a cui l'emendamento appartiene: tasse, sanità, scuola, lavoro…",
    spiegazione:
      "Abbiamo chiesto al programma di scegliere una tra 14 aree. Serve a vedere su cosa si concentrano le proposte dei partiti, non a giudicarle.",
  },
];

export const voce = (id: string) => GLOSSARIO.find((v) => v.id === id);

/** Etichette leggibili per le chiavi tecniche dei dati. */
export const AMBITI: Record<string, string> = {
  fisco: "Tasse e fisco",
  lavoro_pensioni: "Lavoro e pensioni",
  sanita: "Sanità",
  altro: "Altro",
  scuola_universita: "Scuola e università",
  infrastrutture_trasporti: "Strade, ferrovie, trasporti",
  ambiente_energia: "Ambiente ed energia",
  enti_locali: "Comuni, Province e Regioni",
  sociale_famiglia: "Famiglia e sociale",
  imprese_incentivi: "Imprese e incentivi",
  cultura_turismo_sport: "Cultura, turismo e sport",
  agricoltura: "Agricoltura",
  giustizia_pa: "Giustizia e pubblica amministrazione",
  sicurezza_difesa: "Sicurezza e difesa",
};

export const ESITI: Record<string, string> = {
  approvato: "Approvato: è entrato nella legge",
  inammissibile: "Inammissibile: scartato prima del voto",
  non_indicato: "Nessun esito pubblicato dalla Camera",
  respinto: "Respinto: votato e bocciato",
  ritirato: "Ritirato dai firmatari",
  accantonato: "Accantonato: rinviato",
  decaduto: "Decaduto: mai votato",
};

/** Sigle dei gruppi parlamentari della XIX legislatura (Camera). */
export const GRUPPI: Record<string, string> = {
  FDI: "Fratelli d'Italia",
  "PD-IDP": "Partito Democratico",
  M5S: "Movimento 5 Stelle",
  LEGA: "Lega",
  "FI-PPE": "Forza Italia",
  AVS: "Alleanza Verdi e Sinistra",
  "AZ-PER-RE": "Azione",
  "IV-CR": "Italia Viva",
  "NM(N-C-U-I)M-CP": "Noi Moderati",
  MISTO: "Gruppo Misto (deputati senza gruppo proprio)",
  ND: "Gruppo non ricostruito",
};

export const nomeGruppo = (sigla: string) => GRUPPI[sigla] ?? sigla;
export const nomeAmbito = (k: string) => AMBITI[k] ?? k.replace(/_/g, " ");
export const nomeEsito = (k: string) => ESITI[k] ?? k;

/**
 * Spiegazione passo-passo per chi non sa nulla, mostrata in home prima dei numeri.
 * Ogni passo: titolo corto, testo, e (opzionale) id del glossario da linkare.
 */
export const COSA_STAI_GUARDANDO = {
  titolo: "Cosa stai guardando, spiegato da zero",
  passi: [
    {
      titolo: "1. Lo Stato decide come spendere i soldi",
      testo:
        "Ogni anno il Governo scrive la legge di bilancio: quanto va a pensioni, sanità, scuola, quali tasse cambiano, quali bonus. Deve essere approvata dal Parlamento entro il 31 dicembre. Sono i soldi delle tue tasse.",
      id: "legge-di-bilancio",
    },
    {
      titolo: "2. I deputati propongono modifiche",
      testo:
        "Prima del voto, ogni deputato può dire: «qui aggiungete questo», «qui togliete quello», «qui mettete 10 milioni invece di 5». Ognuna di queste proposte scritte si chiama emendamento. Porta un numero e la firma di chi la presenta. Su questa legge ne sono arrivate 5.085.",
      id: "emendamento",
    },
    {
      titolo: "3. Molte proposte sono uguali tra loro",
      testo:
        "Mettendo i testi uno accanto all'altro si scopre che 1.298 sono identici parola per parola a un altro emendamento, quasi sempre firmato da un deputato di un altro partito. Altri sono scritti diversamente ma chiedono la stessa cosa. Chi ha scritto il testo originale? Spesso non un deputato: un'associazione, una categoria, un'azienda, che lo consegna a più parlamentari perché lo depositino.",
      id: "fotocopia-esatta",
    },
    {
      titolo: "4. Un programma li ha letti tutti",
      testo:
        "Nessuna persona ha mai letto tutti i 5.085 emendamenti. Noi li abbiamo fatti leggere a un programma di intelligenza artificiale che risponde a domande chiuse (per esempio: «questo emendamento dà soldi a un Comune preciso?») con una percentuale di sicurezza. È costato 84 centesimi. Il programma non giudica: conta e segnala. Il giudizio spetta a te, e il testo ufficiale è sempre a un clic.",
      id: "programma-di-lettura",
    },
  ],
};

/**
 * Perché i deputati depositano copie e mancette, e cosa comporta per chi legge.
 * Mostrato in home dopo "Cosa stai guardando". Ogni motivo ha la parte
 * "cosa comporta per te" evidenziata. Nessuna affermazione su singoli deputati.
 */
export const PERCHE_LO_FANNO = {
  id: "perche-lo-fanno",
  titolo: "Perché lo fanno? E cosa cambia per te",
  intro:
    "Depositare un emendamento non costa nulla e richiede pochi minuti. Non serve che venga approvato: spesso serve solo che esista. Ecco i quattro motivi più comuni per cui compaiono migliaia di proposte, molte uguali tra loro.",
  motivi: [
    {
      titolo: "Il testo l'ha scritto qualcuno fuori dal Parlamento",
      testo:
        "Associazioni di categoria, sindacati, ordini professionali, aziende, Comuni e Regioni preparano un emendamento già pronto e lo consegnano a più deputati, spesso di partiti diversi. Il ragionamento è semplice: più firme da più parti, più probabilità che qualcuno lo porti avanti o che il Governo lo riprenda. È legale ed è prassi.",
      comporta:
        "Chi ha un ufficio che sa scrivere un testo di legge e conosce i deputati riesce a far arrivare la sua richiesta sul tavolo. Chi non lo ha, no. E il deputato che firma non sempre ha scritto, o letto fino in fondo, quello che deposita.",
    },
    {
      titolo: "Farsi vedere dal proprio territorio",
      testo:
        "Un deputato eletto in una zona deposita «1 milione al Comune di…» o «fondi per la festa di…». Anche se la proposta non passa, può dire al giornale locale e agli elettori: «io ci ho provato». Per questo tante mancette si ripetono ogni anno, uguali.",
      comporta:
        "La legge di bilancio si riempie di piccoli interventi puntuali difficili da valutare uno per uno, invece di regole valide per tutti. Su questa legge ne abbiamo contati 301. Quando uno passa, lo decide una trattativa, non un criterio pubblico su chi ne ha più bisogno.",
    },
    {
      titolo: "Fare numero",
      testo:
        "Le opposizioni depositano migliaia di emendamenti per rallentare i lavori, costringere la maggioranza a trattare, o poter dire di aver contestato ogni punto. Lo stesso testo con prime firme diverse conta come più emendamenti. Anche la maggioranza deposita in massa per segnalare al Governo cosa vuole.",
      comporta:
        "I tempi si allungano e alla fine, per chiudere entro il 31 dicembre, il Governo di solito presenta un unico testo finale e chiede il voto di fiducia. Le migliaia di proposte non votate decadono. Il testo vero viene letto e votato in pochi giorni, con poco tempo per capirlo.",
    },
    {
      titolo: "Mettere un segnaposto per la trattativa",
      testo:
        "Molti emendamenti si depositano sapendo che saranno dichiarati inammissibili o non verranno mai votati. Servono a mettere un tema sul tavolo: poi i partiti ne «segnalano» pochi al Governo, che decide quali accogliere, spesso riscrivendoli.",
      comporta:
        "Cosa entra davvero nella legge lo decidono poche persone in una stanza, non il voto sui 5.085 testi. Su questa legge 1.190 proposte sono state scartate prima del voto e 3.548 non hanno alcun esito pubblicato.",
    },
  ],
  cosa_comportano: {
    titolo: "Le copie, in concreto, cosa comportano",
    punti: [
      "Non sono illegali e non costano soldi di per sé: un emendamento copiato che non passa non sposta un euro.",
      "Dicono chi scrive davvero le leggi. Quando lo stesso testo compare con firme di partiti diversi, l'origine è quasi sempre esterna al Parlamento. Il deputato mette la firma, non la penna.",
      "Gonfiano il lavoro. 1 emendamento su 4 è una ripetizione: gli uffici della Camera, i relatori e il Governo devono comunque leggerlo e valutarlo, con meno tempo per il resto.",
      "Rendono difficile capire chi ha ottenuto cosa. Se un testo firmato da tre partiti entra nella legge, tutti e tre possono dire «l'ho fatto io». Nessuno risponde della richiesta originaria.",
    ],
  },
  cosa_non_dicono: {
    titolo: "Cosa invece non puoi concludere",
    punti: [
      "Che un deputato abbia copiato un altro. Nella maggior parte dei casi entrambi hanno ricevuto lo stesso testo dalla stessa fonte.",
      "Che una richiesta copiata sia sbagliata. Un testo identico può anche essere una proposta giusta condivisa da molti.",
      "Che una mancetta sia immeritata. Il sito dice che è un intervento su misura per un destinatario preciso, non se quel destinatario lo merita.",
    ],
  },
};

/** Perché succede, per ogni tipo di coppia. Mostrato sotto la frase-guida. */
export function percheCoppia(c: {
  esatta: boolean;
  stessoGruppo: boolean;
  stessoRisultato: number;
  soloNumero: number;
}) {
  if (c.esatta && c.stessoGruppo)
    return "Perché succede: lo stesso partito deposita il testo più volte con prime firme diverse, per farlo pesare di più o per dare visibilità a più deputati.";
  if (c.esatta)
    return "Perché succede: di solito il testo è stato scritto da un'associazione, un ente o un'azienda e consegnato a deputati di più partiti, che lo hanno depositato tale e quale.";
  if (c.soloNumero >= 0.8)
    return "Perché succede: stessa richiesta, cifre diverse. Spesso è lo stesso testo esterno adattato da ciascun partito, oppure versioni «di riserva» dello stesso deputato per avere più chance in trattativa.";
  if (c.stessoRisultato >= 0.8)
    return "Perché succede: più partiti hanno la stessa richiesta e la scrivono ognuno a modo proprio, oppure lo stesso testo esterno è stato ritoccato prima del deposito.";
  return "Perché succede: partono probabilmente dalla stessa bozza, poi ognuno ha cambiato destinatario o importo per il proprio territorio.";
}

/** Nota per la matrice "chi copia chi": come leggere la diagonale. */
export const NOTA_MATRICE_DIAGONALE =
  "Le caselle sulla diagonale (stesso partito con se stesso) contano i testi identici depositati più volte dallo stesso gruppo con prime firme diverse. Non è una copia da un altro partito: è un modo per far pesare di più la stessa richiesta, o per dare a più deputati qualcosa da rivendicare sul proprio territorio.";

/** Frase-guida per leggere una coppia, in base a cosa è. */
export function fraseCoppia(c: {
  esatta: boolean;
  stessoRisultato: number;
  stessaBozza: number;
  soloNumero: number;
}) {
  if (c.esatta) return "Stesso testo, parola per parola, depositato due volte da firmatari diversi.";
  if (c.stessoRisultato >= 0.8)
    return "Testi scritti in modo diverso che, secondo il programma, chiedono la stessa cosa.";
  if (c.soloNumero >= 0.8)
    return "Stesso testo, cambia solo una cifra, una data o una percentuale.";
  if (c.stessaBozza >= 0.8)
    return "Sembrano partire dalla stessa bozza, con destinatari o importi cambiati.";
  return "Testi che si somigliano ma che il programma non considera equivalenti.";
}

export const CHI_FIRMA = {
  titolo: "Chi firma più spesso un testo identico a un altro",
  intro:
    "Qui sotto i deputati che più volte hanno firmato per primi un emendamento identico, parola per parola, a un emendamento firmato da qualcun altro. Non significa che abbiano copiato: spesso hanno ricevuto lo stesso testo dalla stessa fonte esterna. Significa che il testo non l'hanno scritto loro.",
  colonne: ["Deputato", "Partito", "Testi identici a un altro", "Su quanti depositati", "Quota"],
};

/** Testo di apertura della home, riga per riga. */
export const IN_DUE_PAROLE = [
  "Ogni anno il Parlamento approva la legge di bilancio: decide come spendere i soldi pubblici. Prima del voto, i deputati possono proporre modifiche, chiamate emendamenti.",
  "Sulla legge di bilancio per il 2025 ne sono stati depositati 5.085 alla Camera. Nessuna persona li ha mai letti tutti.",
  "Li abbiamo fatti leggere a un programma, che per ognuno ha risposto a sette domande semplici e ha confrontato le coppie che si somigliano. Costo: 84 centesimi.",
  "Questo sito mostra cosa è uscito. Ogni numero è cliccabile, ogni parola difficile è spiegata, e ogni emendamento ha il link al testo ufficiale sul sito della Camera.",
];

/** Cosa evidenziare per il cittadino, calcolato dal build sui numeri veri. */
export function evidenze(s: {
  totale_emendamenti: number;
  fotocopie_esatte: number;
  fotocopie_esatte_tra_gruppi: number;
  articoli_aggiuntivi: number;
  mance: number;
  localistici: number;
  per_esito: Record<string, number>;
}) {
  const uno_su = (n: number) => Math.round(s.totale_emendamenti / n);
  return [
    {
      numero: `1 su ${uno_su(s.fotocopie_esatte)}`,
      testo: `è una fotocopia parola per parola di un altro emendamento (${s.fotocopie_esatte.toLocaleString("it-IT")} in tutto). Quasi sempre firmata da partiti diversi: ${s.fotocopie_esatte_tra_gruppi.toLocaleString("it-IT")} casi.`,
      id: "fotocopia-esatta",
    },
    {
      numero: `${Math.round((s.articoli_aggiuntivi / s.totale_emendamenti) * 100)}%`,
      testo: "non corregge la legge: aggiunge qualcosa di nuovo. La manovra è il treno su cui si carica di tutto.",
      id: "articolo-aggiuntivo",
    },
    {
      numero: s.localistici.toLocaleString("it-IT"),
      testo: `riguardano un luogo, un ente o un evento nominato per nome. Di questi, ${s.mance} chiedono una somma precisa per quel destinatario: le «mancette».`,
      id: "mancetta",
    },
    {
      numero: (s.per_esito.approvato ?? 0).toLocaleString("it-IT"),
      testo: `sono diventati legge. ${(s.per_esito.inammissibile ?? 0).toLocaleString("it-IT")} sono stati scartati prima del voto; per gli altri ${(s.per_esito.non_indicato ?? 0).toLocaleString("it-IT")} la Camera non ha pubblicato alcun esito.`,
      id: "esito",
    },
  ];
}

export const DATI_USATI = {
  titolo: "I dati: cosa abbiamo usato e perché solo quelli",
  paragrafi: [
    "Abbiamo usato una sola fonte: il documento ufficiale con cui la Camera dei deputati pubblica gli emendamenti depositati in Commissione Bilancio (documenti.camera.it). Contiene, per ogni emendamento, il testo integrale, il numero, l'articolo a cui si riferisce, i nomi dei firmatari, le note degli uffici e, quando c'è, l'esito.",
    "Perché solo questa. È l'unica fonte ufficiale e completa: non passa da giornali, agenzie o siti di terzi, e chiunque può verificarla. Ogni scheda del sito ha il link alla pagina originale della Camera.",
    "Perché la Camera e non il Senato. Nel 2024 la legge di bilancio è stata esaminata prima dalla Camera, dove è avvenuto tutto il lavoro di modifica. Il Senato l'ha poi approvata senza cambiarla, quindi non ci sono emendamenti significativi da leggere lì.",
    "Perché la Commissione e non l'Aula. È in Commissione che vengono depositati quasi tutti gli emendamenti. Quelli ripresentati in Aula sono una piccola selezione di quelli già letti.",
    "Il partito dei firmatari viene dal sito open data della Camera (dati.camera.it), che registra a quale gruppo appartiene ogni deputato in ogni giorno. Usiamo il gruppo del giorno in cui l'emendamento è stato pubblicato, non quello di oggi.",
    "Cosa non abbiamo usato: dichiarazioni, comunicati, articoli di giornale, resoconti dei dibattiti. Solo i testi depositati, così come sono.",
  ],
};

export const COSA_NON_DICE = [
  "Non dice che copiare un emendamento sia illegale o scorretto. È una pratica comune e ammessa.",
  "Non dice chi ha copiato chi. Sappiamo che due testi sono uguali, non chi lo ha scritto per primo.",
  "Non dice che una «mancetta» sia immeritata. Dice che è una somma per un destinatario preciso, e che meriterebbe uno sguardo.",
  "Non dice quanto costerebbero davvero gli emendamenti. La cifra in euro è una somma grezza di quello che c'è scritto, non una previsione di spesa.",
  "Non dà giudizi su un partito. I conteggi per gruppo dicono chi deposita più emendamenti di un certo tipo, e vanno letti tenendo conto che i gruppi grandi ne depositano di più.",
  "Le percentuali del programma sono stime, non verdetti. Il testo originale è sempre a un clic.",
];
