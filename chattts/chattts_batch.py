#!/usr/bin/env python3
"""
chattts_batch.py - 批量生成，模型只加载一次
输入：JSON 文件，格式为 [{"text": "...", "output": "...", "style": "calm_male"}, ...]
输出：逐条打印进度 JSON，全部完成后写回结果到输入文件
用法：arch -arm64 python3 chattts_batch.py --jobs /tmp/jobs.json
"""
import os, sys, json, argparse

os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

SCRIPT_DIR        = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE       = os.path.join(SCRIPT_DIR, "config.json")
PRESETS_FILE      = os.path.join(SCRIPT_DIR, "voice_presets.json")
SKILL_SPEAKERS_DIR = os.path.join(SCRIPT_DIR, "speakers")

with open(CONFIG_FILE, encoding="utf-8") as _f:
    _cfg = json.load(_f)
CHATTS_ROOT  = _cfg["chatts_root"]
# 优先用 skill 内置 speakers，找不到再回退到 ChatTTS/speakers/
SPEAKERS_DIRS = [SKILL_SPEAKERS_DIR, os.path.join(CHATTS_ROOT, "speakers")]

sys.path.insert(0, CHATTS_ROOT)
os.chdir(CHATTS_ROOT)

import ChatTTS
from tools.audio import pcm_arr_to_mp3_view

def load_presets():
    with open(PRESETS_FILE, encoding="utf-8") as f:
        raw = json.load(f)
    return {k: v for k, v in raw.items() if not k.startswith("_") and isinstance(v, dict) and "speaker_file" in v}

def load_speaker(fname):
    for d in SPEAKERS_DIRS:
        path = os.path.join(d, fname)
        if os.path.exists(path):
            with open(path) as f:
                return f.read().strip()
    raise FileNotFoundError(f"Speaker file not found: {fname} (searched: {SPEAKERS_DIRS})")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--jobs", required=True, help="JSON file with list of {text, output, style}")
    args = parser.parse_args()

    STYLE_PRESETS = load_presets()
    DEFAULT_PRESET = "calm_male"

    with open(args.jobs) as f:
        jobs = json.load(f)

    print(f"[batch] Loading ChatTTS model...", flush=True)
    chat = ChatTTS.Chat()
    chat.load(source="local", compile=False)
    print(f"[batch] Model loaded. Processing {len(jobs)} jobs.", flush=True)

    results = []
    for i, job in enumerate(jobs):
        text   = job["text"]
        output = job["output"]
        style  = job.get("style", DEFAULT_PRESET)
        preset = STYLE_PRESETS.get(style, STYLE_PRESETS[DEFAULT_PRESET])
        spk_emb = load_speaker(preset["speaker_file"])

        try:
            infer_kwargs = dict(
                skip_refine_text=preset.get("skip_refine", True),
                params_infer_code=ChatTTS.Chat.InferCodeParams(
                    spk_emb=spk_emb,
                    temperature=preset["temperature"],
                    top_P=preset["top_P"],
                    top_K=preset["top_K"],
                    repetition_penalty=preset["repetition_penalty"],
                    prompt=preset.get("prompt", ""),
                    manual_seed=preset.get("manual_seed", None),
                ),
            )
            if not preset.get("skip_refine", True):
                infer_kwargs["params_refine_text"] = ChatTTS.Chat.RefineTextParams(
                    prompt=preset.get("refine_prompt", ""),
                )
            try:
                wavs = chat.infer([text], **infer_kwargs)
            except Exception as e_refine:
                if not preset.get("skip_refine", True):
                    print(f"[batch] WARN refine failed ({e_refine}), retry skip_refine", flush=True)
                    infer_kwargs.pop("params_refine_text", None)
                    infer_kwargs["skip_refine_text"] = True
                    wavs = chat.infer([text], **infer_kwargs)
                else:
                    raise
            os.makedirs(os.path.dirname(output), exist_ok=True)
            with open(output, "wb") as f:
                f.write(pcm_arr_to_mp3_view(wavs[0]))
            print(json.dumps({"i": i, "output": output, "style": style, "ok": True}), flush=True)
            results.append({"i": i, "output": output, "ok": True})
        except Exception as e:
            print(json.dumps({"i": i, "output": output, "error": str(e)}), flush=True)
            results.append({"i": i, "output": output, "ok": False, "error": str(e)})

    with open(args.jobs + ".result.json", "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"[batch] Done. {sum(r['ok'] for r in results)}/{len(results)} succeeded.", flush=True)

if __name__ == "__main__":
    main()
