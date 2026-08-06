import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Loader2, CheckCircle2, XCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "confirmed" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("No se ha proporcionado un token de baja.");
      return;
    }

    let cancelled = false;
    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then(async (res) => {
        if (cancelled) return;
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
          setMessage(data.error || "El enlace de baja no es válido o ya ha sido usado.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setMessage("No se ha podido verificar el enlace. Inténtalo de nuevo más tarde.");
        }
      });

    return () => { cancelled = true; };
  }, [token]);

  async function confirm() {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus("confirmed");
      } else {
        setStatus("error");
        setMessage(data.error || "No se ha podido completar la baja.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Inténtalo de nuevo más tarde.");
    }
  }

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-black">ToNOI</h1>
        <p className="mt-2 text-sm text-muted-foreground">Gestión de suscripciones de correo</p>

        <div className="mt-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Verificando enlace...</span>
            </div>
          )}

          {status === "valid" && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/80">
                Si confirmas, dejarás de recibir correos de este remitente.
              </p>
              <Button onClick={confirm} className="w-full">Confirmar baja</Button>
            </div>
          )}

          {status === "confirmed" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="text-sm font-medium">Te has dado de baja correctamente.</p>
            </div>
          )}

          {(status === "invalid" || status === "error") && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-foreground/80">{message || "El enlace no es válido."}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
