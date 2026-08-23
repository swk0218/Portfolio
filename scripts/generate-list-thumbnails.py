from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
OUTPUT_DIR = ROOT / "assets" / "thumbs" / "list"
TARGET_WIDTHS = (960, 1600, 2560)
POSTERS = (
    "assets/projects/odyssey-2023/03.jpg",
    "assets/projects/monitor-os/01.jpg",
)


def read_projects() -> list[dict[str, object]]:
    source = INDEX.read_text(encoding="utf-8")
    marker = "const projects ="
    marker_index = source.index(marker)
    array_index = source.index("[", marker_index)
    projects, _ = json.JSONDecoder().raw_decode(source[array_index:])
    return projects


def clean_path(value: str) -> str:
    return urlsplit(value).path.replace("\\", "/")


def output_stem(source_path: str) -> str:
    path = Path(source_path)
    return f"{path.parent.name}-{path.stem}".lower()


def generate_variants(source_path: str) -> dict[str, object] | None:
    source = ROOT / Path(source_path)
    if source.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        return None

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

        source_width, source_height = image.size
        widths = [width for width in TARGET_WIDTHS if width < source_width]
        widths.append(source_width)
        widths = sorted(set(widths))
        variants: list[dict[str, object]] = []
        icc_profile = image.info.get("icc_profile")

        for width in widths:
            height = round(source_height * width / source_width)
            resized = image if width == source_width else image.resize(
                (width, height), Image.Resampling.LANCZOS
            )
            relative_output = Path("assets") / "thumbs" / "list" / (
                f"{output_stem(source_path)}-{width}.webp"
            )
            output = ROOT / relative_output
            output.parent.mkdir(parents=True, exist_ok=True)
            save_options: dict[str, object] = {
                "format": "WEBP",
                "quality": 94,
                "method": 6,
            }
            if icc_profile:
                save_options["icc_profile"] = icc_profile
            resized.save(output, **save_options)
            variants.append({
                "src": relative_output.as_posix(),
                "width": width,
                "height": height,
            })

    return {
        "width": source_width,
        "height": source_height,
        "variants": variants,
    }


def main() -> None:
    projects = read_projects()
    sources = {
        clean_path(str(project["image"]))
        for project in projects
        if project.get("mediaType") == "image" and project.get("image")
    }
    sources.update(POSTERS)

    manifest: dict[str, object] = {}
    for source_path in sorted(sources):
        generated = generate_variants(source_path)
        if generated:
            manifest[source_path] = generated

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest_path = OUTPUT_DIR / "manifest.js"
    payload = json.dumps(manifest, ensure_ascii=True, separators=(",", ":"))
    manifest_path.write_text(
        f"window.PORTFOLIO_THUMBNAILS=Object.freeze({payload});\n",
        encoding="utf-8",
    )

    original_bytes = sum((ROOT / path).stat().st_size for path in manifest)
    generated_files = [
        ROOT / variant["src"]
        for entry in manifest.values()
        for variant in entry["variants"]
    ]
    generated_bytes = sum(path.stat().st_size for path in generated_files)
    print(
        f"Generated {len(generated_files)} files for {len(manifest)} sources: "
        f"{original_bytes / 1024 / 1024:.2f} MiB originals -> "
        f"{generated_bytes / 1024 / 1024:.2f} MiB responsive set"
    )


if __name__ == "__main__":
    main()
