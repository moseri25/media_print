"""Media inspection via ffprobe, plus source-manifest verification (existence, decode, duration)."""
import json, os, subprocess
from . import REQUIRED_FFMPEG
from .env import find_ffmpeg


def _tool(name):
    """Sibling binary of the selected ffmpeg (pinned 9.0.2 build first)."""
    f = find_ffmpeg()
    if not f:
        return name
    pinned = next((x for x in f if x["version"].lstrip("n").startswith(REQUIRED_FFMPEG)), f[0])
    return os.path.join(os.path.dirname(pinned["path"]), name)


def ffprobe_bin():
    return _tool("ffprobe")


def probe(path):
    r = subprocess.run([ffprobe_bin(), "-v", "error", "-show_format", "-show_streams", "-of", "json", path],
                       capture_output=True, text=True)
    if r.returncode != 0:
        return {"ok": False, "error": r.stderr.strip()}
    j = json.loads(r.stdout)
    d = {"ok": True, "duration": float(j["format"].get("duration", 0)), "streams": []}
    for s in j["streams"]:
        d["streams"].append({k: s.get(k) for k in ("codec_type", "codec_name", "width", "height", "r_frame_rate",
                                                    "sample_rate", "channels", "pix_fmt", "start_time")})
    return d


def decode_check(path):
    r = subprocess.run([_tool("ffmpeg"), "-v", "error", "-i", path, "-f", "null", "-"],
                       capture_output=True, text=True)
    return {"decodes_fully": r.returncode == 0 and not r.stderr.strip(), "stderr": r.stderr.strip()[:500]}


def verify_sources(manifest_path, root):
    """Each source: present on disk? probe + full decode. Never assumes a documented file exists."""
    m = json.load(open(manifest_path))
    for s in m["sources"]:
        p = os.path.join(root, s["expected_path"])
        s["present"] = os.path.exists(p)
        s["inspection"] = None
        if s["present"] and s["kind"] in ("video", "audio"):
            s["inspection"] = {**probe(p), **decode_check(p)}
    return m
