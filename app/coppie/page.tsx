import { getLatestAtto } from "@/lib/data";
import CoppieBrowser from "./CoppieBrowser";

export default function CoppiePage() {
  const atto = getLatestAtto();
  if (!atto) return <p className="text-(--color-faded)">Nessun dato pubblicato.</p>;
  return <CoppieBrowser attoId={atto.attoId} titolo={atto.titolo} />;
}
