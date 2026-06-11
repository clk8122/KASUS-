/**
 * Remonté à chaque navigation par l'App Router : porte la transition
 * d'entrée de page (fondu + élévation), sans bibliothèque externe.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
