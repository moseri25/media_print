# AVATARO Cinematic Engine

Code-driven Hebrew legal-video production engine, rendered with FFmpeg 9.0.2. Early scaffold (v0.1.0).

Implemented and tested: `avataro inspect`, `status`, `storyboard` (timeline continuity check), `qa --srt FILE`
(segment count, tofu characters, Hebrew presence, monotonic timing).
Not implemented yet: assets, animate, preview, render, video/audio QA, typography renderer.

    pip install -e .   # or: PYTHONPATH=src python3 -m avataro.cli status

Source media is never committed (`private_media/` is git-ignored). See `docs/gap_analysis.md`.
