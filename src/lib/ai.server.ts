import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import type { z } from "zod/v4";

const RUN_ID = "X-Lovable-AIG-Run-ID";
const MODEL = "openai/gpt-6-astra";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
}

export class AiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

/** Streams a structured JSON answer from Lovable AI and returns the parsed object. */
export async function generateJson<T>(schema: z.ZodType<T>, instructions: string, prompt: string): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new AiError("AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages: [{ role: "user", content: prompt }],
      output: Output.object({ schema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    return (await result.output) as T;
  } catch (e: unknown) {
    const status = (e as { statusCode?: number })?.statusCode;
    console.error("AI error", status, e);
    if (status === 429) throw new AiError("The coach is busy. Please try again in a moment.", 429);
    if (status === 402) throw new AiError("AI credits have run out. Ask the workspace owner to add more.", 402);
    throw new AiError("The coach couldn't respond right now. Please try again.", status);
  }
}
