// Jev question definitions for the Fotocopiatrice pipeline.
// Instructions are in English (Jev's primary language); the state is Italian
// parliamentary text. Question IDs are for code only and are not sent to the model.

import { choice, noul, score } from "@typesafe-ai/sdk";

export const AMBITI = {
  fisco: "Taxes, tax credits, deductions, tax amnesties, IRPEF/IVA/IRES, revenue collection",
  lavoro_pensioni: "Employment, wages, contracts, social security contributions, pensions, retirement rules",
  sanita: "Healthcare, hospitals, health personnel, pharmaceuticals, disability care",
  scuola_universita: "Schools, teachers, universities, research, students, scholarships",
  imprese_incentivi: "Business incentives, industrial policy, SMEs, credit guarantees, startups",
  infrastrutture_trasporti: "Roads, railways, ports, airports, public works, local transport, bridges",
  enti_locali: "Municipalities, provinces, regions: their budgets, staffing, transfers, accounting rules",
  ambiente_energia: "Environment, energy, climate, water, waste, energy bills, renewables",
  cultura_turismo_sport: "Culture, heritage, cinema, publishing, tourism, sport, events, anniversaries",
  sociale_famiglia: "Family benefits, poverty, housing, childcare, elderly care, third sector, volunteering",
  sicurezza_difesa: "Police, armed forces, firefighters, civil protection, migration, public order",
  giustizia_pa: "Courts, justice staff, public administration organisation, hiring in ministries, digitalisation",
  agricoltura: "Agriculture, fisheries, food, rural development",
  altro: "None of the above fits",
} as const;

export type Ambito = keyof typeof AMBITI;

/**
 * Questions asked once per amendment.
 * State shape: { atto, articolo, id, testo, firmatari: string[], gruppi: string[] }
 */
export const singleQuestions = {
  articolo_aggiuntivo: noul(
    "Does the amendment add entirely new provisions (a new article or new paragraphs) rather than modify or delete existing text? Typical markers: 'Dopo l'articolo ... aggiungere il seguente', 'Dopo il comma ... aggiungere', 'aggiungere, in fine, il seguente comma'.",
    {
      true: "Adds a new article, new paragraph(s) or a new fund/measure that did not exist in the bill",
      false: "Modifies wording, amounts or dates of existing text, or deletes text ('sopprimere')",
    },
  ),
  soppressivo: noul(
    "Does the amendment delete text from the bill (e.g. 'Sopprimere il comma', 'Sopprimere l'articolo', 'le parole ... sono soppresse')?",
  ),
  localistico: noul(
    "Does the amendment direct money, benefits, exemptions or derogations to a specific named territory (a Comune, Provincia, Regione, island, valley, metropolitan area) or to a specific named organisation (a foundation, institute, event, company, hospital, university, association)?",
    {
      true: "A specific place or a specific named organisation is the beneficiary",
      false: "Applies to a general category (all municipalities, all pensioners, all SMEs) or is a rule change without a named beneficiary",
    },
  ),
  beneficiario_identificabile: noul(
    "Can a reader identify concretely who gains from this amendment, either a named entity or a narrowly defined group (e.g. 'i Comuni della provincia di X colpiti dall'alluvione del ...', 'le imprese del settore Y con sede in Z')? Answer no if the benefit goes to broad categories or to the general public.",
  ),
  copertura_indicata: noul(
    "Does the text state how the cost is financed? Typical markers: 'Agli oneri derivanti ... si provvede mediante', 'mediante corrispondente riduzione del Fondo', reference to 'Fondo per le esigenze indifferibili', 'Fondo per interventi strutturali di politica economica', reduction of another allocation.",
  ),
  ambito: choice(
    "Which policy area does this amendment mainly concern?",
    AMBITI,
  ),
  micro_intervento: score(
    "How targeted is this amendment, from a system-wide rule to a one-off handout?",
    [
      "Rule of general application: changes a rule that applies to everyone or to an entire sector of the economy or the state",
      "Sectoral measure: concerns a broad category (a profession, a type of enterprise, a class of beneficiaries) across the whole country",
      "Targeted measure: concerns a narrow group, a single territory, or a single type of institution",
      "Handout: a specific sum of money to one named entity, event, place or project (e.g. 'e' autorizzata la spesa di 500.000 euro per ... a favore del Comune di ...')",
    ],
  ),
};

/**
 * Questions asked once per candidate pair.
 * State shape: { a: { id, articolo, testo, gruppi }, b: { id, articolo, testo, gruppi } }
 */
export const pairQuestions = {
  stesso_effetto: noul(
    "Do amendments `a` and `b` produce the same legal effect: the same change to the same provision, with the same beneficiaries and the same amounts, dates and percentages? Wording may differ. If any amount, date, percentage or target differs in substance, answer no.",
    {
      true: "Adopting either one would change the law in the same way",
      false: "They differ in at least one material element (amount, date, percentage, beneficiary, provision changed) or address different things",
    },
  ),
  stessa_matrice: noul(
    "Do `a` and `b` appear to come from the same source draft? Look for the same sentence structure, the same sequence of clauses, the same unusual phrasing or the same coverage formula, even where amounts, years, percentages or named beneficiaries have been changed.",
    {
      true: "Same template: one reads like an edited copy of the other",
      false: "Independently written texts that merely address a similar topic",
    },
  ),
  differenza_solo_numerica: noul(
    "Is the only substantive difference between `a` and `b` a number (an amount in euro, a percentage, a year, a date, a count)? Answer no if they differ in beneficiaries, provisions targeted, or in what the measure does.",
  ),
};

export type SingleAnswers = {
  articolo_aggiuntivo: number;
  soppressivo: number;
  localistico: number;
  beneficiario_identificabile: number;
  copertura_indicata: number;
  ambito: { choice: Ambito; probabilities: Record<Ambito, number>; confidence: number };
  micro_intervento: { score: number; probabilities: Record<string, number>; confidence: number };
};

export type PairAnswers = {
  stesso_effetto: number;
  stessa_matrice: number;
  differenza_solo_numerica: number;
};
