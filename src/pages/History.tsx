import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function History() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black sm:text-5xl">Historia del torneo</h1>
        <p className="mt-3 text-muted-foreground">Todo lo que ha vivido el ToNOI a lo largo de los años.</p>

        <Card className="mt-10 border-2 border-dashed border-primary/30 bg-[image:var(--gradient-soft)] p-12">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl font-black">Próximamente</h2>
          <p className="mt-2 text-muted-foreground">
            Estamos preparando un viaje completo por la historia del torneo: campeones legendarios, rachas
            inolvidables y los partidos que cambiaron el rumbo del título. Vuelve muy pronto.
          </p>
        </Card>
      </div>
    </div>
  );
}
