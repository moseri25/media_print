# Gap Analysis (observed, not assumed)

Repository `moseri25/media_print` contains a signage-shop website (index/shop/checkout/admin, `images/`).
It holds no AVATARO code, history, QA reports or media. Prior versions 11/12/14, the Colab project and the
HeyGen assets were not found on this machine or in this repo.

| Requirement | Observed | Status |
|---|---|---|
| Presenter video (HeyGen) | not present | BLOCKED |
| Original Hebrew audio (~68.19 s) | not present | BLOCKED |
| SRT, 17 segments / transcript | not present | BLOCKED |
| Wetness B-roll (~8 s) | not present | BLOCKED |
| FFmpeg 9.0.2 | system has 6.1.1; upstream tag `n9.0.2` (ce8f11b9) exists; source build started in the session container, not yet verified | IN_PROGRESS |
| GPU | none (CPU only, 4 cores, ~15 GB RAM) | limits AI image/video generation |
| Hebrew fonts | Noto Sans/Serif Hebrew installed via apt; glyph coverage not yet tested | to verify |
| OpenCV, CairoSVG, OTIO, torch | not installed | to add as needed |

Consequences: no final video, lip-sync claim or "APPROVED_FINAL" is possible. Engine scaffolding, storyboard,
manifests, QA tooling and preview-class work can proceed. The storyboard times come from the brief and are
approximate until re-derived from the SRT and forced alignment. Narration text is filled only where the brief quotes it.

Needed from the operator: the HeyGen MP4, original audio, SRT, transcript, B-roll, and any approved branding.
Place them under `private_media/` (git-ignored) and run `avataro inspect`.
