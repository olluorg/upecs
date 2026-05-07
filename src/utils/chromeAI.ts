// Chrome Built-in AI (Gemini Nano) — Prompt API
// Chrome 127–137: window.ai.languageModel  (capabilities / create)
// Chrome 138+:    window.LanguageModel     (availability / create — static methods)

// ── Type declarations ────────────────────────────────────────────────────────

interface LegacySession {
  prompt(text: string): Promise<string>;
  destroy(): void;
}
interface LegacyLM {
  capabilities(): Promise<{ available: "readily" | "after-download" | "no" }>;
  create(opts?: { systemPrompt?: string; temperature?: number; topK?: number }): Promise<LegacySession>;
}

interface ModernSession {
  prompt(text: string): Promise<string>;
  destroy(): void;
}
interface ModernLMConstructor {
  availability(): Promise<"available" | "downloadable" | "downloading" | "unavailable">;
  create(opts?: {
    systemPrompt?: string;
    temperature?: number;
    topK?: number;
    expectedInputLanguages?: string[];
    expectedOutputLanguages?: string[];
  }): Promise<ModernSession>;
}

declare global {
  interface Window {
    ai?: { languageModel?: LegacyLM; assistant?: LegacyLM };
    LanguageModel?: ModernLMConstructor;
  }
}

// ── Availability ─────────────────────────────────────────────────────────────

export async function checkAIAvailability(): Promise<"readily" | "after-download" | "no"> {
  try {
    // Chrome 138+ — window.LanguageModel (static class)
    if (window.LanguageModel) {
      const status = await window.LanguageModel.availability();
      console.log("[ChromeAI] LanguageModel.availability() =", status);
      if (status === "available")    return "readily";
      if (status === "downloadable" || status === "downloading") return "after-download";
      return "no";
    }

    // Chrome 127–137 — window.ai.languageModel
    const lm = window.ai?.languageModel ?? window.ai?.assistant;
    if (lm) {
      const caps = await lm.capabilities();
      console.log("[ChromeAI] ai.languageModel.capabilities() =", caps);
      return caps.available;
    }

    console.log("[ChromeAI] No API found. window.ai:", window.ai, "window.LanguageModel:", window.LanguageModel);
    return "no";
  } catch (e) {
    console.log("[ChromeAI] checkAIAvailability error:", e);
    return "no";
  }
}

// ── Compose ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_RU = `Ты помогаешь ребёнку с ААС (альтернативная и дополнительная коммуникация).
Тебе дают список слов-концептов. Составь из них одно короткое естественное предложение от первого лица на русском языке.
Отвечай ТОЛЬКО готовым предложением — без кавычек, без пояснений, без лишних слов.
Примеры:
Яблоко, Дай → Дай мне яблоко
Мама, Помоги → Мама, помоги мне
Сок, Хочу, Ещё → Я хочу ещё сока`;

const SYSTEM_PROMPT_EN = `You help a child using AAC (augmentative and alternative communication).
You receive a list of concept words. Compose one short natural first-person sentence in English.
Reply with ONLY the sentence — no quotes, no explanation.
Examples:
Apple, Give → Give me an apple
Mom, Help → Mom, help me
Juice, Want, More → I want more juice`;

export async function composeSentence(
  words: string[],
  lang: "RU" | "EN" = "RU",
): Promise<string> {
  const systemPrompt = lang === "RU" ? SYSTEM_PROMPT_RU : SYSTEM_PROMPT_EN;
  const input = words.join(", ");

  // Chrome 138+
  if (window.LanguageModel) {
    const session = await window.LanguageModel.create({
      systemPrompt,
      temperature: 0.4,
      topK: 10,
      expectedInputLanguages: [lang === "RU" ? "ru" : "en"],
      expectedOutputLanguages: ["en"], // ru not yet supported; system prompt overrides
    });
    try {
      return (await session.prompt(input)).trim();
    } finally {
      session.destroy();
    }
  }

  // Chrome 127–137
  const lm = window.ai?.languageModel ?? window.ai?.assistant;
  if (!lm) throw new Error("Chrome AI not available");
  const session = await lm.create({ systemPrompt, temperature: 0.4, topK: 10 });
  try {
    return (await session.prompt(input)).trim();
  } finally {
    session.destroy();
  }
}
