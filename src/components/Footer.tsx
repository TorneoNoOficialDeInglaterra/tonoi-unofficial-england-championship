export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border py-8">
      <div className="container flex flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} Torneo No Oficial de Inglaterra (ToNOI)</p>
        <p>Web oficial del torneo — creada y gestionada por sus fundadores.</p>
      </div>
    </footer>
  );
}
