from __future__ import annotations

import json
from pathlib import Path

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".avif"}


def build_manifest(images_dir: Path, output_path: Path) -> list[str]:
    if not images_dir.exists():
        images_dir.mkdir(parents=True, exist_ok=True)

    files = [
        file.name
        for file in sorted(images_dir.iterdir(), key=lambda item: item.name.lower())
        if file.is_file() and file.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    output_path.write_text(json.dumps(files, ensure_ascii=False) + "\n", encoding="utf-8")
    return files


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    build_manifest(root / "imagens", root / "images.json")
