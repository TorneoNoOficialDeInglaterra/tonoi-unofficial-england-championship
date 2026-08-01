import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Faq = { id: string; question: string; answer: string; display_order: number };

export default function FaqPage() {
  const q = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
  });

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-black sm:text-5xl">Preguntas frecuentes</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Las dudas más comunes sobre el ToNOI.</p>

      {q.isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Aún no hay preguntas frecuentes publicadas.
        </p>
      ) : (
        <Accordion type="single" collapsible className="mt-8 w-full space-y-3">
          {(q.data ?? []).map((f) => (
            <AccordionItem
              key={f.id}
              value={f.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]"
            >
              <AccordionTrigger
                icon="plus-minus"
                className="px-5 py-5 text-left text-lg font-semibold uppercase tracking-wide leading-snug hover:no-underline sm:text-xl"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', Impact, sans-serif" }}
              >
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="whitespace-pre-line px-5 pb-5 text-base leading-relaxed text-muted-foreground">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
