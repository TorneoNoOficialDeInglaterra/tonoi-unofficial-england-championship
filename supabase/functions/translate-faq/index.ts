import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    question_en: { type: "string" },
    answer_en: { type: "string" },
    question_it: { type: "string" },
    answer_it: { type: "string" },
  },
  required: ["question_en", "answer_en", "question_it", "answer_it"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "No autorizado" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "No autorizado" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Solo administradores" }, 403);

    const body = await req.json().catch(() => null);
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
    if (!question || !answer) return json({ error: "Faltan la pregunta o la respuesta" }, 400);
    if (question.length > 1000 || answer.length > 8000) return json({ error: "Texto demasiado largo" }, 400);

    const runId = req.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        ...(runId ? { "X-Lovable-AIG-Run-ID": runId } : {}),
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        stream: true,
        store: false,
        instructions:
          "Eres traductor especializado en fútbol. Traduces preguntas frecuentes de una web de un torneo histórico de fútbol (ToNOI) del español al inglés y al italiano. Mantén nombres propios de clubes y competiciones sin traducir, conserva el tono y no añadas información nueva.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Pregunta (ES): ${question}\n\nRespuesta (ES): ${answer}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "faq_translations",
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 429) return json({ error: "Límite de peticiones alcanzado. Inténtalo en un momento." }, 429);
      if (res.status === 402) return json({ error: "Créditos de IA agotados." }, 402);
      return json({ error: `Error de IA: ${detail.slice(0, 300)}` }, 502);
    }

    // Read the SSE stream and accumulate output text deltas.
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && !text && evt.response?.output_text) {
            text = evt.response.output_text;
          }
        } catch {
          // ignore non-JSON keepalives
        }
      }
    }

    let parsed: Record<string, string> | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (!parsed?.question_en || !parsed?.answer_en || !parsed?.question_it || !parsed?.answer_it) {
      return json({ error: "La IA no devolvió una traducción válida. Inténtalo de nuevo." }, 502);
    }

    return json({
      question_en: parsed.question_en,
      answer_en: parsed.answer_en,
      question_it: parsed.question_it,
      answer_it: parsed.answer_it,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
