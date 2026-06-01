import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
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
    <div className="container max-w-3xl py-10">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-black sm:text-5xl">Preguntas frecuentes</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Las dudas más comunes sobre el ToNOI.</p>

      <Card className="mt-6 p-4 sm:p-6">
        {q.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (q.data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay preguntas frecuentes publicadas.
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {(q.data ?? []).map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Card>
    </div>
  );
}
