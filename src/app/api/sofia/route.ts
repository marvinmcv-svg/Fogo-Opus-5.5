import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { runTool, systemBlocks, TOOLS } from "@/lib/sofia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-opus-5-5";
const MAX_TOOL_ROUNDS = 6;

const Body = z.object({
  message: z.string().trim().min(1).max(1500),
  lang: z.enum(["es", "en"]).default("es"),
  // Prior turns exactly as this endpoint returned them (assistant content blocks
  // are echoed back unchanged so thinking/fallback blocks stay valid).
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.union([z.string(), z.array(z.any())]) }))
    .max(80)
    .default([]),
});

// Tiny per-IP limiter — enough to stop a runaway script from burning tokens.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json({ error: "offline" }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const raw = await req.text();
  if (raw.length > 300_000) return Response.json({ error: "too_large" }, { status: 413 });
  const parsed = Body.safeParse(JSON.parse(raw || "{}"));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { message, lang, history } = parsed.data;

  const messages = [...(history as Anthropic.Beta.BetaMessageParam[]), { role: "user" as const, content: message }];
  const client = new Anthropic();
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      let jsonRetries = 0;
      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const stream = client.beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 16000,
              // Chat replies don't need deep deliberation; low effort keeps Sofía snappy.
              thinking: { type: "adaptive" },
              output_config: { effort: "low" },
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              system: systemBlocks(lang),
              tools: TOOLS,
              messages,
            },
            { signal: req.signal },
          );
          stream.on("text", (delta) => send({ type: "text", text: delta }));

          let msg: Anthropic.Beta.BetaMessage;
          try {
            msg = await stream.finalMessage();
            jsonRetries = 0;
          } catch (err) {
            // Eager input streaming: an unparseable tool input rejects here. Retry that turn only.
            if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
            send({ type: "reset" });
            round--;
            continue;
          }

          if (msg.stop_reason === "refusal") {
            send({ type: "text", text: lang === "en" ? "I'm sorry, I can't help with that. Is there anything about your visit I can help with?" : "Lo siento, no puedo ayudar con eso. ¿Hay algo de tu visita en lo que pueda ayudarte?" });
            break;
          }

          messages.push({ role: "assistant", content: msg.content });

          if (msg.stop_reason === "pause_turn") continue;
          const toolUses = msg.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          if (toolUses.length === 0) break;
          if (msg.stop_reason === "max_tokens") throw new Error("tool input truncated");

          send({ type: "working" });
          const results = await Promise.all(
            toolUses.map(async (t) => {
              const r = await runTool(t.name, t.input);
              if (r.event) send({ type: "reservation", action: r.event.action, reservation: r.event.reservation });
              return { type: "tool_result" as const, tool_use_id: t.id, content: r.content, is_error: r.isError };
            }),
          );
          messages.push({ role: "user", content: results });
        }
        send({ type: "history", history: messages });
        send({ type: "done" });
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) send({ type: "error", error: "busy" });
        else if (err instanceof Anthropic.APIUserAbortError) {
          /* client went away */
        } else {
          console.error("[sofia]", err);
          send({ type: "error", error: "failed" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
