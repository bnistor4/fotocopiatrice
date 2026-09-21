// Helper di formattazione puri: importabili anche dai componenti client.

// it-IT non raggruppa le cifre a 4 posizioni (5085 → "5085"): forziamo il
// separatore per restare coerenti con i testi ("5.085").
export const fmtNum = (n: number) =>
  new Intl.NumberFormat("it-IT", { useGrouping: "always" }).format(n);
