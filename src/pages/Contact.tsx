import { useState } from "react";
import { z } from "zod";
import { Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Indica tu nombre").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  message: z.string().trim().min(5, "Escribe un mensaje").max(2000),
});

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const parsed = schema.safeParse({ name, email, message });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return toast.error(first.message);
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Mensaje enviado. Te responderemos lo antes posible.");
    setName(""); setEmail(""); setMessage("");
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="flex items-center gap-3 text-4xl font-black sm:text-5xl">
        <Mail className="h-9 w-9 text-primary" /> Contacto
      </h1>
      <p className="mt-2 text-muted-foreground">
        ¿Tienes una duda, sugerencia o quieres reportar un partido? Escríbenos y te responderemos lo antes posible.
      </p>

      <Card className="mt-8 p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" maxLength={100} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" maxLength={255} />
          </div>
          <div>
            <Label htmlFor="msg">Mensaje</Label>
            <Textarea id="msg" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Cuéntanos..." maxLength={2000} />
          </div>
          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" /> {sending ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </div>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">
        Los mensajes se reciben directamente en la cuenta del torneo: torneonooficialdeinglaterra@gmail.com
      </p>
    </div>
  );
}
