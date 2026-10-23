"""Environment discovery. Reports only what is actually observed."""
import os, re, shutil, subprocess, json, platform

CANDIDATES = [os.environ.get("AVATARO_FFMPEG"), "/opt/ffmpeg-9.0.2/bin/ffmpeg", shutil.which("ffmpeg")]


def _run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=30).stdout
    except Exception as e:  # noqa: BLE001
        return f"ERROR: {e}"


def find_ffmpeg():
    """Prefer the pinned 9.0.2 build; never silently fall back without reporting it."""
    found = []
    for c in CANDIDATES:
        if c and os.path.exists(c) and c not in [f["path"] for f in found]:
            out = _run([c, "-version"]).splitlines()
            m = re.search(r"ffmpeg version (\S+)", out[0]) if out else None
            found.append({"path": c, "version": m.group(1) if m else "unknown"})
    return found


def ffmpeg_report():
    from . import REQUIRED_FFMPEG
    found = find_ffmpeg()
    pinned = next((f for f in found if f["version"].lstrip("n").startswith(REQUIRED_FFMPEG)), None)
    rep = {"required": REQUIRED_FFMPEG, "found": found, "pinned_available": bool(pinned)}
    use = pinned or (found[0] if found else None)
    if use:
        cfg = _run([use["path"], "-hide_banner", "-buildconf"])
        enc = _run([use["path"], "-hide_banner", "-encoders"])
        flt = _run([use["path"], "-hide_banner", "-filters"])
        rep["selected"] = use
        rep["checks"] = {
            "libx264": "libx264" in enc, "aac": " aac " in enc,
            "libass": "--enable-libass" in cfg and " ass " in flt,
            "harfbuzz": "--enable-libharfbuzz" in cfg, "fribidi": "--enable-libfribidi" in cfg,
            "ffprobe": os.path.exists(use["path"].replace("ffmpeg", "ffprobe")),
        }
    return rep


def hebrew_fonts():
    out = _run(["fc-list", ":lang=he", "family"])
    return sorted({l.split(",")[0].strip() for l in out.splitlines() if l.strip()})


def environment():
    mem = re.search(r"MemTotal:\s+(\d+)", open("/proc/meminfo").read()) if os.path.exists("/proc/meminfo") else None
    du = shutil.disk_usage(".")
    mods = {}
    for m in ("numpy", "PIL", "cv2", "cairosvg", "torch", "opentimelineio"):
        try:
            __import__(m); mods[m] = True
        except Exception:  # noqa: BLE001
            mods[m] = False
    return {
        "os": platform.platform(), "python": platform.python_version(),
        "node": _run(["node", "--version"]).strip() or None, "cpu_count": os.cpu_count(),
        "ram_gb": round(int(mem.group(1)) / 1048576, 1) if mem else None,
        "disk_free_gb": round(du.free / 1e9, 1),
        "gpu": "nvidia-smi present" if shutil.which("nvidia-smi") else "none detected (CPU only)",
        "python_modules": mods, "hebrew_fonts": hebrew_fonts(), "ffmpeg": ffmpeg_report(),
    }


if __name__ == "__main__":
    print(json.dumps(environment(), ensure_ascii=False, indent=2))
