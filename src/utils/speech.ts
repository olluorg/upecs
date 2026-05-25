// Озвучка с fallback-стратегией.
//
// На части устройств/браузеров window.speechSynthesis не работает (нет голосов,
// отключён, баги Android/Linux). Поэтому для карточек из набора мы сначала
// пытаемся проиграть заранее сгенерированный MP3 (см. scripts/generate_audio.py),
// и только если файла нет или он не проиграл — откатываемся на speechSynthesis.
//
// Файлы лежат в public/audio/<lang>/<id>.mp3, а manifest.json перечисляет,
// для каких карточек аудио реально существует, чтобы не дёргать сеть впустую.

const AUDIO_BASE = "/audio";

type LangKey = "ru" | "en";

let manifest: Record<LangKey, Set<string>> = { ru: new Set(), en: new Set() };
let manifestPromise: Promise<void> | null = null;

function langKey(lang: string): LangKey {
  return lang === "RU" ? "ru" : "en";
}

/** Загружает манифест аудио один раз. Отсутствие файла — не ошибка (просто нет fallback'а). */
export function loadAudioManifest(): Promise<void> {
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch(`${AUDIO_BASE}/manifest.json`, { cache: "force-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { languages?: Record<string, string[]> } | null) => {
      const langs = data?.languages;
      if (langs) {
        manifest = {
          ru: new Set(langs.ru ?? []),
          en: new Set(langs.en ?? []),
        };
      }
    })
    .catch(() => {
      /* нет манифеста — работаем только на speechSynthesis */
    });
  return manifestPromise;
}

function hasAudio(cardId: string, lang: string): boolean {
  return manifest[langKey(lang)].has(cardId);
}

function audioUrl(cardId: string, lang: string): string {
  return `${AUDIO_BASE}/${langKey(lang)}/${encodeURIComponent(cardId)}.mp3`;
}

// Токен текущего воспроизведения: новый вызов прерывает предыдущую очередь.
let playToken = 0;
let currentAudio: HTMLAudioElement | null = null;

function stopAll(): number {
  playToken += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  return playToken;
}

function playFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`audio error: ${url}`));
    audio.play().catch(reject);
  });
}

function speakSynth(text: string, lang: string, rate = 0.3): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "RU" ? "ru-RU" : "en-US";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

/** Динамический текст (например, фраза, собранная ИИ) — только speechSynthesis. */
export function speakText(text: string, lang: string): void {
  stopAll();
  speakSynth(text, lang);
}

type SpeakCard = { id: string; label: string; custom?: boolean };

/** Озвучить одну карточку: сначала MP3, иначе speechSynthesis. */
export async function speakCard(card: SpeakCard, lang: string): Promise<void> {
  const token = stopAll();
  if (!card.custom && hasAudio(card.id, lang)) {
    try {
      await playFile(audioUrl(card.id, lang));
      return;
    } catch {
      if (token !== playToken) return; // прервали новым вызовом
    }
  }
  if (token !== playToken) return;
  speakSynth(card.label, lang);
}

/**
 * Озвучить последовательность карточек (фразу без ИИ).
 * Если для всех есть MP3 — проигрываем по очереди (работает и без speechSynthesis),
 * иначе озвучиваем всю фразу целиком через speechSynthesis.
 */
export async function speakCards(cards: SpeakCard[], lang: string): Promise<void> {
  const token = stopAll();
  if (!cards.length) return;

  const allHaveAudio = cards.every((c) => !c.custom && hasAudio(c.id, lang));
  if (allHaveAudio) {
    for (const card of cards) {
      if (token !== playToken) return;
      try {
        await playFile(audioUrl(card.id, lang));
      } catch {
        if (token !== playToken) return;
        speakSynth(cards.map((c) => c.label).join(" "), lang);
        return;
      }
    }
    return;
  }

  speakSynth(cards.map((c) => c.label).join(" "), lang);
}
