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
| FFmpeg 9.0.2 | built from upstream tag `n9.0.2` (946fcce0 per local checkout) into `/opt/ffmpeg-9.0.2` in the session container; verified libx264, aac, libass, harfbuzz, fribidi. Not persisted in git (rebuild per session) | IN_PROGRESS |
| GPU | none (CPU only, 4 cores, ~15 GB RAM) | limits AI image/video generation |
| Hebrew fonts | Noto Sans/Serif Hebrew installed via apt; glyph coverage not yet tested | to verify |
| OpenCV, CairoSVG, OTIO, torch | not installed | to add as needed |

Consequences: no final video, lip-sync claim or "APPROVED_FINAL" is possible. Engine scaffolding, storyboard,
manifests, QA tooling and preview-class work can proceed. The storyboard times come from the brief and are
approximate until re-derived from the SRT and forced alignment. Narration text is filled only where the brief quotes it.

Needed from the operator: the HeyGen MP4, original audio, SRT, transcript, B-roll, and any approved branding.
Place them under `private_media/` (git-ignored) and run `avataro inspect`.

## Update: avatar and voice feasibility (verified)
- Presenter still received (1125x2000 portrait). Still only: no talking-head video exists yet.
- Lip-sync generation needs a GPU model. Sandbox has no GPU and HuggingFace downloads return proxy 403; the curated HF Spaces list has no audio-driven lip-sync Space.
- Fish Audio Drama 3: 35B MoE (FP8), benchmarked on H200; license is the Fish Audio research/community license (commercial use must be checked). Cannot run on this 15 GB CPU box.
