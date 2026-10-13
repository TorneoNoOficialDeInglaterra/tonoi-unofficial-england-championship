import { createRoot } from "react-dom/client";
import { ResultadoChampions } from "@/components/social/templates/ResultadoChampions";
import type { TemplateData } from "@/components/social/templates/shared";
import type { Team } from "@/lib/tonoi";

const home: Team = { id: "gala", name: "Galatasaray SK", logo_url: null } as Team;
const away: Team = { id: "barca", name: "FC Barcelona", logo_url: null } as Team;

function build(scorers: TemplateData["scorers"]): TemplateData {
  return {
    type: "resultado",
    competition: "champions",
    domesticLeague: "laliga",
    homeTeam: home,
    awayTeam: away,
    date: "2026-10-13",
    time: "21:00",
    stadium: "Rams Park",
    homeGoals: 1,
    awayGoals: 4,
    scorers,
  };
}

const VARIANTS: Record<string, TemplateData> = {
  four: build([
    { side: "home", minute: "28", player: "Batrakov" },
    { side: "away", minute: "43", player: "Cancelo" },
    { side: "away", minute: "20", player: "Fermín" },
    { side: "away", minute: "53", player: "Gordon" },
    { side: "away", minute: "65", player: "Adeyemi" },
  ]),
  six: build([
    { side: "home", minute: "28", player: "Batrakov" },
    { side: "home", minute: "12", player: "Osimhen" },
    { side: "home", minute: "55", player: "Icardi" },
    { side: "home", minute: "70", player: "Zielinski" },
    { side: "home", minute: "80", player: "Yilmaz" },
    { side: "home", minute: "88", player: "Akgun" },
    { side: "away", minute: "43", player: "Cancelo" },
    { side: "away", minute: "20", player: "Fermín" },
    { side: "away", minute: "53", player: "Gordon" },
    { side: "away", minute: "65", player: "Adeyemi" },
    { side: "away", minute: "77", player: "Raphinha" },
    { side: "away", minute: "90", player: "Lewandowski" },
  ]),
};

export function mount(variant = "four") {
  const el = document.createElement("div");
  el.id = "tpl-test";
  el.style.cssText = "position:fixed;left:0;top:0;width:1080px;height:1080px;z-index:99999;background:#000";
  document.body.appendChild(el);
  createRoot(el).render(<ResultadoChampions data={VARIANTS[variant]} />);
}
