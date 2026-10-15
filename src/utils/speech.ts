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

function bcp47(lang: string): string {
  return lang === "RU" ? "ru-RU" : "en-US";
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

function shouldUseRecording(card: { id: string; custom?: boolean }, lang: string): boolean {
  return !settings.preferSynth && !card.custom && hasAudio(card.id, lang);
}

function audioUrl(cardId: string, lang: string): string {
  return `${AUDIO_BASE}/${langKey(lang)}/${encodeURIComponent(cardId)}.mp3`;
}

// ── Настройки озвучки ────────────────────────────────────────────────────────
//
// Храним в localStorage: speech.ts — обычный модуль без доступа к React-стейту,
// а настройки нужны синхронно в момент воспроизведения.

export type SpeechSettings = {
  /** Темп речи. 1 — обычный. Раньше здесь было 0.3 — на такой скорости движки «плывут». */
  rate: number;
  pitch: number;
  volume: number;
  /** Выбранный пользователем голос (voiceURI) для каждого языка. */
  voiceURI: Record<LangKey, string | null>;
  /** Пауза между словами фразы, мс. */
  gapMs: number;
  /**
   * Озвучивать карточки системным голосом вместо записанного MP3.
   * Записанная озвучка надёжнее (работает везде), но на устройствах с хорошим
   * системным голосом он звучит живее — пусть выбирает пользователь.
   */
  preferSynth: boolean;
};

export type SpeechSettingsPatch = Omit<Partial<SpeechSettings>, "voiceURI"> & {
  voiceURI?: Partial<Record<LangKey, string | null>>;
};

const SETTINGS_KEY = "pecs:speech";

const DEFAULT_SETTINGS: SpeechSettings = {
  rate: 0.95,
  pitch: 1,
  volume: 1,
  voiceURI: { ru: null, en: null },
  gapMs: 140,
  preferSynth: false,
};

export const RATE_MIN = 0.5;
export const RATE_MAX = 1.5;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function readSettings(): SpeechSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<SpeechSettings>;
    return {
      rate: clamp(Number(parsed.rate) || DEFAULT_SETTINGS.rate, RATE_MIN, RATE_MAX),
      pitch: clamp(Number(parsed.pitch) || DEFAULT_SETTINGS.pitch, 0.5, 2),
      volume: clamp(parsed.volume ?? DEFAULT_SETTINGS.volume, 0, 1),
      voiceURI: {
        ru: parsed.voiceURI?.ru ?? null,
        en: parsed.voiceURI?.en ?? null,
      },
      gapMs: clamp(parsed.gapMs ?? DEFAULT_SETTINGS.gapMs, 0, 800),
      preferSynth: parsed.preferSynth ?? DEFAULT_SETTINGS.preferSynth,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

let settings: SpeechSettings = readSettings();
const settingsListeners = new Set<(s: SpeechSettings) => void>();

export function getSpeechSettings(): SpeechSettings {
  return settings;
}

export function setSpeechSettings(patch: SpeechSettingsPatch): SpeechSettings {
  settings = { ...settings, ...patch, voiceURI: { ...settings.voiceURI, ...patch.voiceURI } };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* приватный режим — настройки живут только до перезагрузки */
  }
  settingsListeners.forEach((cb) => cb(settings));
  return settings;
}

export function subscribeSpeechSettings(cb: (s: SpeechSettings) => void): () => void {
  settingsListeners.add(cb);
  return () => settingsListeners.delete(cb);
}

// ── Выбор голоса ─────────────────────────────────────────────────────────────
//
// Браузер отдаёт дефолтный голос, который на Linux/Android часто оказывается
// eSpeak — именно он звучит «роботом». Поэтому ранжируем голоса сами:
// нейросетевые и облачные (Google / Microsoft Natural / Apple premium) заметно
// качественнее компактных офлайн-движков.

const GOOD_VOICE_NAMES = [
  // RU
  "milena", "yuri", "katya", "alena", "svetlana", "dariya", "irina", "pavel",
  // EN
  "samantha", "alex", "karen", "daniel", "moira", "tessa", "serena", "ava", "allison",
];

function scoreVoice(voice: SpeechSynthesisVoice, want: LangKey): number {
  const vLang = voice.lang.toLowerCase().replace("_", "-");
  if (!vLang.startsWith(want)) return -Infinity;

  const name = voice.name.toLowerCase();
  let score = 0;

  // Явно плохие компактные движки.
  if (/espeak|compact|pico|festival|flite/.test(name)) score -= 100;

  if (/natural|neural/.test(name)) score += 45;
  if (/google/.test(name)) score += 30;
  if (/online/.test(name)) score += 22;
  if (/premium|enhanced|siri/.test(name)) score += 20;
  if (/microsoft/.test(name)) score += 8;
  if (GOOD_VOICE_NAMES.some((n) => name.includes(n))) score += 18;

  // Сетевые голоса обычно качественнее локальных компактных.
  if (!voice.localService) score += 10;

  // Точное совпадение локали (ru-RU, а не ru-BY) — чуть приоритетнее.
  if (vLang === (want === "ru" ? "ru-ru" : "en-us")) score += 6;
  else if (want === "en" && /^en-(gb|au|ca)/.test(vLang)) score += 3;

  if (voice.default) score += 4;

  return score;
}

function allVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  try {
    return window.speechSynthesis.getVoices();
  } catch {
    return [];
  }
}

/** Голоса для языка, отсортированные от лучшего к худшему (для селекта в настройках). */
export function listVoices(lang: string): SpeechSynthesisVoice[] {
  const want = langKey(lang);
  return allVoices()
    .filter((v) => scoreVoice(v, want) > -Infinity)
    .sort((a, b) => scoreVoice(b, want) - scoreVoice(a, want));
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const want = langKey(lang);
  const chosen = settings.voiceURI[want];
  const voices = allVoices();
  if (chosen) {
    const exact = voices.find((v) => v.voiceURI === chosen);
    if (exact) return exact;
  }
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const s = scoreVoice(v, want);
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return best;
}

/**
 * getVoices() в Chrome при первом вызове возвращает пустой список — список
 * приезжает асинхронно событием voiceschanged. Дёргаем заранее, чтобы к первому
 * нажатию на карточку голос уже был выбран.
 */
export function warmUpVoices(onReady?: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  if (allVoices().length) {
    onReady?.();
    return () => {};
  }
  const handler = () => onReady?.();
  window.speechSynthesis.addEventListener("voiceschanged", handler);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
}

// ── Воспроизведение ──────────────────────────────────────────────────────────

// Токен текущего воспроизведения: новый вызов прерывает предыдущую очередь.
let playToken = 0;
let currentAudio: HTMLAudioElement | null = null;

// Chrome обрывает синтез примерно через 15 секунд, а на Android уводит его в
// paused при любом «чихе» — периодический resume() лечит оба случая.
let resumePump: ReturnType<typeof setInterval> | null = null;

function startResumePump() {
  if (resumePump) return;
  resumePump = setInterval(() => {
    const synth = window.speechSynthesis;
    if (!synth || !synth.speaking) {
      stopResumePump();
      return;
    }
    synth.resume();
  }, 5000);
}

function stopResumePump() {
  if (resumePump) {
    clearInterval(resumePump);
    resumePump = null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopAll(): number {
  playToken += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  stopResumePump();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  return playToken;
}

/** Прервать любую текущую озвучку. */
export function stopSpeaking(): void {
  stopAll();
}

function playFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = settings.rate;
    audio.volume = settings.volume;
    currentAudio = audio;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`audio error: ${url}`));
    audio.play().catch(reject);
  });
}

function speakSynth(text: string, lang: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47(lang);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      stopResumePump();
      resolve();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
    startResumePump();
  });
}

/**
 * cancel() и сразу speak() в Chrome иногда «съедает» реплику — даём движку кадр
 * на то, чтобы очередь действительно опустела.
 */
async function speakSynthAfterCancel(text: string, lang: string, token: number): Promise<void> {
  await delay(60);
  if (token !== playToken) return;
  await speakSynth(text, lang);
}

/** Динамический текст (например, фраза, собранная ИИ) — только speechSynthesis. */
export function speakText(text: string, lang: string): void {
  const token = stopAll();
  void speakSynthAfterCancel(text, lang, token);
}

type SpeakCard = { id: string; label: string; custom?: boolean };

/** Озвучить одну карточку: сначала MP3, иначе speechSynthesis. */
export async function speakCard(card: SpeakCard, lang: string): Promise<void> {
  const token = stopAll();
  if (shouldUseRecording(card, lang)) {
    try {
      await playFile(audioUrl(card.id, lang));
      return;
    } catch {
      if (token !== playToken) return; // прервали новым вызовом
    }
  }
  if (token !== playToken) return;
  await speakSynthAfterCancel(card.label, lang, token);
}

export type SpeakCardsOptions = {
  /** Индекс озвучиваемого слова (для подсветки карточки), null — озвучка закончилась. */
  onIndex?: (index: number | null) => void;
};

/**
 * Озвучить последовательность карточек (фразу без ИИ).
 * Если для всех есть MP3 — проигрываем по очереди (работает и без speechSynthesis),
 * иначе озвучиваем слова по одному через speechSynthesis.
 *
 * Слова проговариваются раздельно с короткой паузой: фраза из PECS-карточек —
 * это перечисление концептов, слитно она звучит скороговоркой.
 */
export async function speakCards(
  cards: SpeakCard[],
  lang: string,
  options: SpeakCardsOptions = {},
): Promise<void> {
  const token = stopAll();
  if (!cards.length) return;
  const { onIndex } = options;

  try {
    for (let i = 0; i < cards.length; i++) {
      if (token !== playToken) return;
      const card = cards[i];
      onIndex?.(i);

      if (i > 0 && settings.gapMs > 0) {
        await delay(settings.gapMs);
        if (token !== playToken) return;
      }

      if (shouldUseRecording(card, lang)) {
        try {
          await playFile(audioUrl(card.id, lang));
          continue;
        } catch {
          if (token !== playToken) return;
        }
      }
      await speakSynthAfterCancel(card.label, lang, token);
    }
  } finally {
    if (token === playToken) onIndex?.(null);
  }
}
