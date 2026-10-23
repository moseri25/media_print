import json, os, sys, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from avataro.cli import check_srt, load
from avataro import STATUSES

GOOD = "1\n00:00:00,000 --> 00:00:03,200\nקניתם דירה חדשה מקבלן?\n"


def _srt(t):
    f = tempfile.NamedTemporaryFile("w", suffix=".srt", delete=False, encoding="utf-8"); f.write(t); f.close(); return f.name


def test_srt_ok():
    assert check_srt(_srt(GOOD), 1)["pass"]


def test_srt_tofu_flagged():
    assert not check_srt(_srt(GOOD.replace("דירה", "□□")), 1)["pass"]


def test_srt_wrong_count():
    assert not check_srt(_srt(GOOD), 17)["pass"]


def test_project_not_falsely_final():
    assert load("project.json")["status"] in STATUSES and load("project.json")["status"] != "APPROVED_FINAL"
    assert load("storyboard.json")["scenes"][-1]["end"] == 68.2
