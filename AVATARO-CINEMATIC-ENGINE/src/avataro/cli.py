import argparse, json, os, re, sys
from . import STATUSES
from .env import environment
from .media import verify_sources

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROJ = os.path.join(ROOT, "projects", "legal-building-defects")
HEB = re.compile(r"[֐-׿]")
TOFU = re.compile(r"[�□■]")


def load(n):
    return json.load(open(os.path.join(PROJ, n), encoding="utf-8"))


def cmd_inspect(a):
    env = environment()
    src = verify_sources(os.path.join(PROJ, "source_manifest.json"), ROOT)
    os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
    json.dump(env, open(os.path.join(ROOT, "reports", "environment.json"), "w"), ensure_ascii=False, indent=2)
    json.dump(src, open(os.path.join(PROJ, "source_manifest.json"), "w"), ensure_ascii=False, indent=2)
    ff = env["ffmpeg"]
    print(f"FFmpeg required {ff['required']}: pinned available = {ff['pinned_available']}; selected = {ff.get('selected')}")
    print("GPU:", env["gpu"], "| RAM GB:", env["ram_gb"], "| disk free GB:", env["disk_free_gb"])
    print("Hebrew fonts:", ", ".join(env["hebrew_fonts"]) or "NONE")
    for s in src["sources"]:
        print(f"  [{'OK' if s['present'] else 'MISSING'}] {s['id']:17} {s['expected_path']}")
    return 0


def cmd_status(a):
    p = load("project.json")
    print("Project:", p["name"], "\nStatus:", p["status"])
    if p.get("blocked_reason"):
        print("Blocked:", p["blocked_reason"])
    for n in ("storyboard", "asset_manifest", "shotlist", "timeline", "audio_manifest", "render_manifest", "quality_report"):
        print(f"  {n:16}", load(n + ".json").get("status"))
    return 0


def cmd_storyboard(a):
    sb = load("storyboard.json")
    prev = 0.0
    for s in sb["scenes"]:
        assert abs(s["start"] - prev) < 1e-6, f"gap/overlap before scene {s['id']}"
        prev = s["end"]
        print(f"{s['id']} {s['start']:6.1f}-{s['end']:5.1f}  {s['role']}")
    print(f"contiguous, total {prev:.1f}s (approximate; source audio governs)")
    return 0


def check_srt(path, expect_segments=17):
    """Subtitle QA: segment count, tofu characters, Hebrew presence, monotonic timing."""
    txt = open(path, encoding="utf-8").read()
    blocks = [b for b in re.split(r"\n\s*\n", txt.strip()) if b.strip()]
    res, last = [], -1.0
    ts = re.compile(r"(\d+):(\d+):(\d+)[,.](\d+) --> (\d+):(\d+):(\d+)[,.](\d+)")
    for b in blocks:
        m = ts.search(b)
        if not m:
            res.append(("bad-timestamp", b[:40])); continue
        g = list(map(int, m.groups()))
        st, en = g[0]*3600+g[1]*60+g[2]+g[3]/1000, g[4]*3600+g[5]*60+g[6]+g[7]/1000
        if st < last or en <= st:
            res.append(("non-monotonic", b[:40]))
        last = en
        body = b[m.end():]
        if TOFU.search(body): res.append(("tofu-char", b[:40]))
        if not HEB.search(body): res.append(("no-hebrew", b[:40]))
    return {"segments": len(blocks), "expected": expect_segments, "pass": len(blocks) == expect_segments and not res, "issues": res}


def cmd_qa(a):
    if a.srt:
        r = check_srt(a.srt)
        print(json.dumps(r, ensure_ascii=False, indent=2)); return 0 if r["pass"] else 1
    print("QA: no artifact supplied. Use --srt FILE. Video/audio QA gates are not implemented yet.")
    return 2


def main(argv=None):
    ap = argparse.ArgumentParser(prog="avataro")
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("inspect").set_defaults(f=cmd_inspect)
    sp.add_parser("status").set_defaults(f=cmd_status)
    sp.add_parser("storyboard").set_defaults(f=cmd_storyboard)
    q = sp.add_parser("qa"); q.add_argument("--srt"); q.set_defaults(f=cmd_qa)
    a = ap.parse_args(argv)
    return a.f(a)


if __name__ == "__main__":
    sys.exit(main())
