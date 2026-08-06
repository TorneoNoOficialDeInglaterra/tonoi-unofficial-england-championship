import { useState } from "react";
import { z } from "zod";
import { Mail, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function Contact() {
  const { t } = useTranslation("pages");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t("contact.errors.name")).max(100),
    email: z.string().trim().email(t("contact.errors.email")).max(255),
    message: z.string().trim().min(5, t("contact.errors.message")).max(2000),
  });

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
    toast.success(t("contact.success"));
    setName(""); setEmail(""); setMessage("");
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="flex items-center gap-3 text-4xl font-black sm:text-5xl">
        <Mail className="h-9 w-9 text-primary" /> {t("contact.title")}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {t("contact.intro")}
      </p>

      <Card className="mt-8 p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("contact.nameLabel")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("contact.namePlaceholder")} maxLength={100} />
          </div>
          <div>
            <Label htmlFor="email">{t("contact.emailLabel")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("contact.emailPlaceholder")} maxLength={255} />
          </div>
          <div>
            <Label htmlFor="msg">{t("contact.messageLabel")}</Label>
            <Textarea id="msg" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("contact.messagePlaceholder")} maxLength={2000} />
          </div>
          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" /> {sending ? t("contact.sending") : t("contact.sendButton")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
