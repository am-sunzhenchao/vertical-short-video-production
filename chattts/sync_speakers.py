#!/usr/bin/env python3
"""
sync_speakers.py - 把 skill 内置的 speakers/ 同步到用户的 ChatTTS/speakers/ 目录
其他人下载 skill 后运行一次即可，无需自己跑 gen_demos.py
"""
import os, sys, json, shutil

SCRIPT_DIR        = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE       = os.path.join(SCRIPT_DIR, "config.json")
SKILL_SPEAKERS_DIR = os.path.join(SCRIPT_DIR, "speakers")

if not os.path.isfile(CONFIG_FILE):
    print("❌ config.json 不存在，请先运行 skill 完成 ChatTTS 路径配置")
    sys.exit(1)

with open(CONFIG_FILE, encoding="utf-8") as f:
    cfg = json.load(f)

CHATTS_ROOT  = cfg.get("chatts_root", "")
SPEAKERS_DST = os.path.join(CHATTS_ROOT, "speakers")

if not os.path.isdir(SPEAKERS_DST):
    print(f"❌ 目标目录不存在: {SPEAKERS_DST}")
    print("请确认 config.json 中的 chatts_root 路径正确")
    sys.exit(1)

files = [f for f in os.listdir(SKILL_SPEAKERS_DIR) if f.endswith(".txt")]
ok = 0
for fname in sorted(files):
    src = os.path.join(SKILL_SPEAKERS_DIR, fname)
    dst = os.path.join(SPEAKERS_DST, fname)
    shutil.copy2(src, dst)
    print(f"  ✅ {fname}")
    ok += 1

print(f"\n完成：{ok} 个 speaker 文件已同步到 {SPEAKERS_DST}")
