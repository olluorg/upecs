#!/usr/bin/env python3
"""
Автономная генерация озвучки карточек (fallback для устройств без speechSynthesis).

Что делает:
  1. При первом запуске сам создаёт виртуальное окружение scripts/.venv,
     ставит зависимости (torch, numpy, lameenc) и перезапускается внутри него.
  2. Читает список карточек из src/data/cards.json и подписи из
     src/locales/ru.ts и src/locales/en.ts (та же логика, что в приложении:
     cardLabels[id] либо label из cards.json).
  3. Через Silero TTS синтезирует каждое слово и сохраняет MP3 в
     public/audio/<lang>/<id>.mp3 (по умолчанию RU=baya, EN=en_0).
  4. Пишет public/audio/manifest.json — приложение по нему понимает,
     для каких карточек есть готовое аудио.

Использование (на машине с Python 3.9+):
    python scripts/generate_audio.py

Полезные флаги:
    --langs ru,en        какие языки генерировать (по умолчанию ru,en)
    --force              перегенерировать даже существующие файлы
    --ru-speaker baya    голос для русского (baya/kseniya/xenia/aidar/eugene)
    --en-speaker en_0    голос для английского (en_0 .. en_117)
    --sample-rate 24000  частота дискретизации (8000/24000/48000)
    --bitrate 64         битрейт MP3, кбит/с
    --limit N            сгенерировать только первые N карточек (для теста)

GPU: если установлен torch с CUDA — используется автоматически (RTX 3090 и т.п.).
По умолчанию ставится обычный torch. Чтобы поставить CUDA-сборку, задайте перед
запуском переменную окружения, например:
    TORCH_INDEX_URL=https://download.pytorch.org/whl/cu121 python scripts/generate_audio.py

После прогона просто закоммитьте новые файлы из public/audio/.
"""

from __future__ import annotations

import os
import sys
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
VENV_DIR = SCRIPT_DIR / ".venv"

# ──────────────────────────── bootstrap venv ────────────────────────────


def _venv_python() -> Path:
    if os.name == "nt":
        return VENV_DIR / "Scripts" / "python.exe"
    return VENV_DIR / "bin" / "python"


def _bootstrap_and_reexec() -> None:
    """Создаёт venv, ставит зависимости и перезапускает скрипт внутри venv."""
    import venv

    if not VENV_DIR.exists():
        print(f"[bootstrap] Создаю виртуальное окружение: {VENV_DIR}")
        venv.create(VENV_DIR, with_pip=True)

    py = str(_venv_python())
    print("[bootstrap] Обновляю pip и ставлю зависимости (torch, numpy, lameenc)...")
    subprocess.check_call([py, "-m", "pip", "install", "--upgrade", "pip", "wheel"])

    torch_index = os.environ.get("TORCH_INDEX_URL")
    torch_cmd = [py, "-m", "pip", "install", "torch"]
    if torch_index:
        torch_cmd += ["--index-url", torch_index]
    subprocess.check_call(torch_cmd)
    subprocess.check_call([py, "-m", "pip", "install", "numpy", "lameenc", "omegaconf"])

    env = dict(os.environ, TTS_BOOTSTRAPPED="1")
    print("[bootstrap] Перезапускаюсь внутри venv...\n")
    ret = subprocess.call([py, os.path.abspath(__file__)] + sys.argv[1:], env=env)
    sys.exit(ret)


if os.environ.get("TTS_BOOTSTRAPPED") != "1":
    _bootstrap_and_reexec()

# ──────────────────── дальше выполняется уже внутри venv ─────────────────

import argparse
import json
import re
import time

import numpy as np
import torch
import lameenc

# Русские числа: подписи карточек-цифр это "0".."9", их нужно проговаривать словами.
RU_NUMBERS = {
    "0": "ноль", "1": "один", "2": "два", "3": "три", "4": "четыре",
    "5": "пять", "6": "шесть", "7": "семь", "8": "восемь", "9": "девять",
}

SILERO_MODELS = {
    "ru": dict(language="ru", model_id="v4_ru"),
    "en": dict(language="en", model_id="v3_en"),
}


def parse_card_labels(ts_path: Path) -> dict[str, str]:
    """Достаёт объект cardLabels из .ts-локали как dict id -> подпись."""
    text = ts_path.read_text(encoding="utf-8")
    start = text.find("cardLabels:")
    if start == -1:
        raise ValueError(f"cardLabels не найден в {ts_path}")
    brace = text.find("{", start)
    depth = 0
    end = brace
    for i in range(brace, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i
                break
    inner = text[brace + 1 : end]
    pairs = re.findall(r'"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"', inner)
    return {k: v.replace('\\"', '"') for k, v in pairs}


def load_cards() -> list[dict]:
    cards_path = PROJECT_ROOT / "src" / "data" / "cards.json"
    return json.loads(cards_path.read_text(encoding="utf-8"))


def text_for(card: dict, labels: dict[str, str], lang: str) -> str:
    """Та же логика, что getCardLabel: cardLabels[id] либо label из cards.json."""
    label = labels.get(card["id"], card.get("label", ""))
    label = label.strip()
    if lang == "ru" and label in RU_NUMBERS:
        return RU_NUMBERS[label]
    return label


def load_silero(lang: str, device: torch.device):
    cfg = SILERO_MODELS[lang]
    print(f"[silero] Загружаю модель {cfg['model_id']} ({lang})...")
    model, _ = torch.hub.load(
        repo_or_dir="snakers4/silero-models",
        model="silero_tts",
        language=cfg["language"],
        speaker=cfg["model_id"],
        trust_repo=True,
    )
    model.to(device)
    return model


def synth(model, lang: str, text: str, speaker: str, sample_rate: int) -> np.ndarray:
    kwargs = dict(text=text, speaker=speaker, sample_rate=sample_rate)
    if lang == "ru":
        kwargs.update(put_accent=True, put_yo=True)
    audio = model.apply_tts(**kwargs)
    return audio.detach().cpu().numpy().astype(np.float32)


def write_mp3(samples: np.ndarray, sample_rate: int, bitrate: int, out_path: Path) -> None:
    pcm = np.clip(samples * 32767.0, -32768, 32767).astype("<i2")
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(bitrate)
    encoder.set_in_sample_rate(sample_rate)
    encoder.set_channels(1)
    encoder.set_quality(2)  # 2 = высокое качество
    data = encoder.encode(pcm.tobytes())
    data += encoder.flush()
    out_path.write_bytes(data)


def write_manifest(audio_root: Path, langs: list[str], sample_rate: int) -> None:
    languages: dict[str, list[str]] = {}
    for lang in langs:
        d = audio_root / lang
        ids = sorted(p.stem for p in d.glob("*.mp3")) if d.exists() else []
        languages[lang] = ids
    manifest = {
        "version": int(time.time()),
        "format": "mp3",
        "sampleRate": sample_rate,
        "languages": languages,
    }
    (audio_root / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    counts = ", ".join(f"{k}: {len(v)}" for k, v in languages.items())
    print(f"[manifest] Записан public/audio/manifest.json ({counts})")


def main() -> None:
    ap = argparse.ArgumentParser(description="Генерация озвучки карточек (Silero TTS).")
    ap.add_argument("--langs", default="ru,en", help="через запятую: ru,en")
    ap.add_argument("--force", action="store_true", help="перегенерировать существующие")
    ap.add_argument("--ru-speaker", default="baya")
    ap.add_argument("--en-speaker", default="en_0")
    ap.add_argument("--sample-rate", type=int, default=24000, choices=[8000, 24000, 48000])
    ap.add_argument("--bitrate", type=int, default=64)
    ap.add_argument("--limit", type=int, default=0, help="0 = все карточки")
    args = ap.parse_args()

    langs = [l.strip() for l in args.langs.split(",") if l.strip()]
    speakers = {"ru": args.ru_speaker, "en": args.en_speaker}

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type == "cpu":
        torch.set_num_threads(os.cpu_count() or 4)
    print(f"[device] Использую: {device} "
          f"({'GPU ' + torch.cuda.get_device_name(0) if device.type == 'cuda' else 'CPU'})")

    cards = load_cards()
    if args.limit:
        cards = cards[: args.limit]

    labels_by_lang = {
        "ru": parse_card_labels(PROJECT_ROOT / "src" / "locales" / "ru.ts"),
        "en": parse_card_labels(PROJECT_ROOT / "src" / "locales" / "en.ts"),
    }

    audio_root = PROJECT_ROOT / "public" / "audio"

    torch.manual_seed(0)  # детерминированный вывод между прогонами

    for lang in langs:
        out_dir = audio_root / lang
        out_dir.mkdir(parents=True, exist_ok=True)
        model = load_silero(lang, device)
        speaker = speakers[lang]

        made, skipped, empty = 0, 0, 0
        for i, card in enumerate(cards, 1):
            out_path = out_dir / f"{card['id']}.mp3"
            if out_path.exists() and not args.force:
                skipped += 1
                continue
            text = text_for(card, labels_by_lang[lang], lang)
            if not text:
                empty += 1
                continue
            try:
                samples = synth(model, lang, text, speaker, args.sample_rate)
                write_mp3(samples, args.sample_rate, args.bitrate, out_path)
                made += 1
            except Exception as e:  # noqa: BLE001
                print(f"  [warn] {card['id']} ('{text}'): {e}")
            if i % 100 == 0:
                print(f"  [{lang}] {i}/{len(cards)}...")
        print(f"[{lang}] готово: создано {made}, пропущено {skipped}, без подписи {empty}")

    write_manifest(audio_root, langs, args.sample_rate)
    print("\nГотово. Закоммитьте новые файлы из public/audio/.")


if __name__ == "__main__":
    main()
