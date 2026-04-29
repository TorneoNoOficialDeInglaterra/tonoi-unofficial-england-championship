import { Link, NavLink } from "react-router-dom";
import { Menu, Twitter, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import logoImg from "@/assets/logo.png";
const LOGO = logoImg;

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/clasificacion", label: "Clasificación" },
  { to: "/historial", label: "Historial de partidos" },
  { to: "/estadisticas", label: "Estadísticas" },
  { to: "/historia", label: "Historia del torneo" },
  { to: "/contacto", label: "Contacto" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container flex h-16 items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menú">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <img src={LOGO} alt="ToNOI" className="h-8 w-8" />
                <span className="font-bold tracking-wide">ToNOI</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={LOGO} alt="Logo ToNOI" className="h-10 w-10" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-base font-extrabold tracking-tight">ToNOI</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Torneo No Oficial de Inglaterra</span>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild aria-label="Twitter del torneo">
            <a href="https://twitter.com/ToNOI_Oficial" target="_blank" rel="noreferrer">
              <Twitter className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Contacto">
            <Link to="/contacto"><Mail className="h-5 w-5" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
