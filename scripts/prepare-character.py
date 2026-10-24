#!/usr/bin/env python3
"""Extract original sprites and remove edge-connected baked checkerboard backgrounds.

Requires Python 3.10+, Pillow, numpy and opencv-python.
Run: python scripts/prepare-character.py --archive PATH_TO_karakter.zip
Original archive bytes are preserved. The contact sheet is outside the repository.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
import zipfile

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE = Path.home() / "Downloads" / "karakter.zip"
DEFAULT_REVIEW = Path.home() / "AppData/Local/Temp/opencode/character-contact-sheet.png"
CANVAS = (448, 544)
FOOT_ANCHOR = (224, 528)
TARGET_HEAD_WIDTH = 128


def edge_connected_background(rgb: np.ndarray) -> np.ndarray:
    """Flood only light, near-neutral pixels connected to an image edge.

    Do not globally color-key: pale eyes, metal, and the white back emblem
    enclosed by the character must stay opaque.
    """
    values = rgb.astype(np.int16)
    candidates = ((values.min(axis=2) >= 180)
                  & (np.ptp(values, axis=2) <= 22)).astype(np.uint8)
    _, labels = cv2.connectedComponents(candidates, connectivity=8)
    edge_labels = np.unique(np.concatenate((labels[0], labels[-1],
                                            labels[:, 0], labels[:, -1])))
    edge_labels = edge_labels[edge_labels != 0]
    return np.isin(labels, edge_labels)


def head_width(rgb: np.ndarray, foreground: np.ndarray) -> int:
    """Estimate the largest warm skin component in the upper half of a sprite."""
    values = rgb.astype(np.int16)
    red, green, blue = (values[:, :, index] for index in range(3))
    skin = ((red > 135) & (red - green > 20) & (green - blue > 12)
            & foreground)
    skin[round(rgb.shape[0] * 0.55):] = False
    count, _, stats, _ = cv2.connectedComponentsWithStats(skin.astype(np.uint8), 8)
    if count <= 1:
        raise ValueError("No head component found; inspect the source manually")
    component = stats[1:][np.argmax(stats[1:, cv2.CC_STAT_AREA])]
    return int(component[cv2.CC_STAT_WIDTH])


def process(source: Image.Image) -> tuple[Image.Image, dict]:
    rgb = np.array(source.convert("RGB"))
    background = edge_connected_background(rgb)
    foreground = ~background
    # A 1px edge is selectively matted instead of deleting bright interior detail.
    # The dark outline makes a binary flood mask reliable; mild feathering here
    # avoids leaving the light antialias fringe from the flattened background.
    distance = cv2.distanceTransform(foreground.astype(np.uint8), cv2.DIST_L2, 5)
    alpha = np.where(background, 0, 255).astype(np.uint8)
    border = foreground & (distance <= 1.0)
    # Estimate coverage against a neutral ~240 checker square. Keep dark linework
    # fully opaque; only neutral, light boundary pixels have fractional alpha.
    neutral = np.ptp(rgb.astype(np.int16), axis=2) <= 26
    lightness = rgb.mean(axis=2)
    matte = border & neutral & (lightness > 80)
    coverage = np.clip((240.0 - lightness) / 160.0, 0.0, 1.0)
    alpha[matte] = np.round(coverage[matte] * 255).astype(np.uint8)
    cleaned = rgb.copy()
    # Unmatte fractional edge colors onto a dark outline, rather than retain gray.
    cleaned[matte] = 80
    cleaned[alpha == 0] = 0
    rgba = Image.fromarray(np.dstack((cleaned, alpha)))
    bounds = rgba.getbbox()
    if not bounds:
        raise ValueError("The background mask removed the entire sprite")
    cropped = rgba.crop(bounds)
    width = head_width(rgb, foreground)
    scale = min(TARGET_HEAD_WIDTH / width,
                (CANVAS[0] - 32) / cropped.width,
                (CANVAS[1] - 32) / cropped.height)
    size = (round(cropped.width * scale), round(cropped.height * scale))
    # Premultiplied-alpha resampling prevents dark/white transparent pixel halos.
    resized = cropped.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    result = Image.new("RGBA", CANVAS)
    position = (FOOT_ANCHOR[0] - size[0] // 2, FOOT_ANCHOR[1] - size[1])
    result.alpha_composite(resized, position)
    output = np.array(result)
    output[output[:, :, 3] == 0, :3] = 0
    result = Image.fromarray(output)
    return result, {
        "original_size": list(source.size),
        "source_content_bbox": list(bounds),
        "estimated_head_width": width,
        "uniform_scale": round(scale, 6),
        "resized_content_size": list(size),
        "content_offset": list(position),
        "output_content_bbox": list(result.getbbox()),
        "removed_background_pixels": int(background.sum()),
        "transparent_pixels": int((output[:, :, 3] == 0).sum()),
        "opaque_pixels": int((output[:, :, 3] == 255).sum()),
        "partial_alpha_pixels": int(((output[:, :, 3] > 0) & (output[:, :, 3] < 255)).sum()),
    }


def contact_sheet(images: list[tuple[str, Image.Image]], destination: Path) -> None:
    tile = (280, 370)
    sheet = Image.new("RGB", (tile[0] * 4, tile[1] * 2), "#233044")
    draw = ImageDraw.Draw(sheet)
    for index, (name, image) in enumerate(images):
        x, y = (index % 4) * tile[0], (index // 4) * tile[1]
        draw.text((x + 10, y + 8), name, fill="white")
        # Dark and teal halves make any surviving white checker visible.
        draw.rectangle((x + 8, y + 30, x + 136, y + 354), fill="#303745")
        draw.rectangle((x + 137, y + 30, x + 271, y + 354), fill="#56a7a3")
        preview = image.copy()
        preview.thumbnail((264, 320), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + (280 - preview.width) // 2, y + 34), preview)
        draw.line((x + 8, y + 344, x + 271, y + 344), fill="#dfab67")
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, default=DEFAULT_ARCHIVE)
    parser.add_argument("--review", type=Path, default=DEFAULT_REVIEW)
    args = parser.parse_args()
    original = ROOT / "assets/character/original"
    processed = ROOT / "assets/character/processed"
    original.mkdir(parents=True, exist_ok=True)
    processed.mkdir(parents=True, exist_ok=True)
    records = {}
    images = []
    archive_bytes = args.archive.read_bytes()
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        for entry in sorted(archive.infolist(), key=lambda item: item.filename):
            if entry.is_dir() or Path(entry.filename).suffix.lower() != ".png":
                continue
            if Path(entry.filename).name != entry.filename:
                raise ValueError(f"Unexpected nested/unsafe archive path: {entry.filename}")
            raw = archive.read(entry)
            (original / entry.filename).write_bytes(raw)
            with Image.open(io.BytesIO(raw)) as source:
                result, record = process(source)
            target = processed / entry.filename
            result.save(target, optimize=True)
            record.update({"original": f"original/{entry.filename}",
                           "processed": f"processed/{entry.filename}",
                           "original_sha256": hashlib.sha256(raw).hexdigest(),
                           "processed_sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
            records[entry.filename] = record
            images.append((entry.filename, result))
    manifest = {
        "schema_version": 1,
        "generator": "scripts/prepare-character.py",
        "dependencies": ["Pillow", "numpy", "opencv-python"],
        "source_archive": args.archive.name,
        "source_archive_sha256": hashlib.sha256(archive_bytes).hexdigest(),
        "output_mode": "RGBA",
        "canvas_size": list(CANVAS),
        "foot_anchor": list(FOOT_ANCHOR),
        "foot_anchor_normalized": [FOOT_ANCHOR[0] / CANVAS[0], FOOT_ANCHOR[1] / CANVAS[1]],
        "normalization": "Uniform scale from estimated skin/head width (target 128px), capped to canvas; content horizontally centered and lowest foot aligned to y=528. No stretching.",
        "segmentation": "8-connected edge flood of light near-neutral checkerboard (min RGB >=180; channel range <=22); selective one-pixel edge unmatting; premultiplied-alpha Lanczos resize.",
        "limitations": [
            "The white/gray checkerboard is baked into opaque RGB originals; true original alpha is unavailable.",
            "Boundary alpha and colors are estimated, not losslessly recovered. Fine edge pixels may differ from the source artwork.",
            "Only edge-connected light regions are removed, preserving enclosed white eyes, metal, and back emblem. Enclosed background islands are not globally color-keyed.",
            "Head-width scale is heuristic; body proportions and running/waving pose heights intentionally differ. The anchor is the horizontal content center at the lowest visible foot, not an anatomical ankle pivot.",
        ],
        "poses": records,
    }
    (ROOT / "assets/character/manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    contact_sheet(images, args.review)
    print(f"Processed {len(records)} poses; canvas {CANVAS}; foot anchor {FOOT_ANCHOR}")
    print(f"Contact sheet: {args.review}")
    for name, record in records.items():
        print(f"{name}: crop={record['source_content_bbox']}, head={record['estimated_head_width']}, scale={record['uniform_scale']}, content={record['resized_content_size']}")


if __name__ == "__main__":
    main()
