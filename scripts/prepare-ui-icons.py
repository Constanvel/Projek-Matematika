"""Prepare the user's downloaded UI sprites (requires Pillow).

Usage: python scripts/prepare-ui-icons.py --source-root <download-folder>
Only named PNG entries are read from the ZIPs; no archive content is executed.
"""
import argparse
import hashlib
import io
import json
from collections import deque
from pathlib import Path
from zipfile import ZipFile

from PIL import Image


SPECS = {
    'heart-full': ('Nyawa/IMG_7688.zip', 'IMG_7688.png', (78, 90, 257, 244), 16, False),
    'heart-empty': ('Nyawa/IMG_7688.zip', 'IMG_7688.png', (438, 90, 622, 244), 16, False),
    'gold': ('aset leaderboard dll.zip', 'medali emas.png', None, 32, False),
    'silver': ('aset leaderboard dll.zip', 'medali perak.png', None, 32, False),
    'bronze': ('aset leaderboard dll.zip', 'medali perunggu.png', None, 32, False),
    'speaker': ('tombol dll/IMG_7715.zip', 'IMG_7716.png', None, 32, False),
    'muted': ('tombol dll/IMG_7715.zip', 'IMG_7717.png', None, 32, False),
    'play': ('tombol dll/IMG_7709.zip', 'IMG_7709.png', (123, 65, 220, 176), 32, True),
    'settings': ('tombol dll/IMG_7709.zip', 'IMG_7710.png', (64, 55, 182, 175), 32, True),
    'back': ('tombol dll/IMG_7709.zip', 'IMG_7712.png', (98, 38, 217, 142), 32, True),
    'leaderboard': ('tombol dll/IMG_7715.zip', 'IMG_7714.png', (49, 27, 179, 145), 32, True),
    'music': ('tombol dll/IMG_7715.zip', 'IMG_7713.png', (77, 29, 184, 142), 32, True),
    'home': ('tombol dll/IMG_7715.zip', 'IMG_7715.png', (78, 25, 199, 146), 32, True),
}


def remove_plate(image):
    """Remove the button plate outside the icon's closed dark outline."""
    pixels = image.load()
    width, height = image.size
    queue = deque([(x, y) for x in range(width) for y in (0, height - 1)]
                  + [(x, y) for y in range(height) for x in (0, width - 1)])
    seen = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < width and 0 <= y < height):
            continue
        seen.add((x, y))
        r, g, b, a = pixels[x, y]
        if a >= 128 and max(r, g, b) < 85:
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))


def largest_shape(image):
    """Discard isolated alpha specks, retaining the icon and its enclosed details."""
    mask = image.getchannel('A').point(lambda value: 255 if value >= 160 else 0)
    pixels = mask.load()
    width, height = image.size
    seen, largest = set(), set()
    for y in range(height):
        for x in range(width):
            if not pixels[x, y] or (x, y) in seen:
                continue
            shape, queue = set(), [(x, y)]
            while queue:
                point = queue.pop()
                px, py = point
                if point in seen or not (0 <= px < width and 0 <= py < height):
                    continue
                seen.add(point)
                if not pixels[px, py]:
                    continue
                shape.add(point)
                queue.extend((px + dx, py + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)
            if len(shape) > len(largest):
                largest = shape
    if not largest:
        raise ValueError('No visible icon found')
    clean = Image.new('L', image.size)
    for point in largest:
        clean.putpixel(point, 255)
    image.putalpha(clean)
    return image.crop(clean.getbbox())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', required=True, type=Path)
    args = parser.parse_args()
    output = Path(__file__).resolve().parent.parent / 'assets' / 'ui'
    output.mkdir(parents=True, exist_ok=True)
    manifest = {'licenseStatus': 'unverified-user-supplied', 'icons': {}}
    for name, (archive, entry, crop, size, cutout) in SPECS.items():
        with ZipFile(args.source_root / archive) as source:
            data = source.read(entry)
        image = Image.open(io.BytesIO(data)).convert('RGBA')
        if crop:
            image = image.crop(crop)
        if cutout:
            remove_plate(image)
        if name == 'heart-empty':
            # The stepped outline has separate corner blocks; keep every segment.
            alpha = image.getchannel('A').point(lambda value: 255 if value >= 160 else 0)
            image.putalpha(alpha)
            image = image.crop(alpha.getbbox())
        else:
            image = largest_shape(image)
        if name == 'settings':
            # The blue gear centre is a hole, not part of the button plate.
            pixels = image.load()
            for y in range(image.height):
                for x in range(image.width):
                    r, g, b, a = pixels[x, y]
                    if b - r > 65:
                        pixels[x, y] = (r, g, b, 0)
        if name == 'heart-empty':
            pixels = image.load()
            for y in range(image.height):
                for x in range(image.width):
                    r, g, b, a = pixels[x, y]
                    pixels[x, y] = (max(r, 104), max(g, 121), max(b, 132), a)
        image.thumbnail((size - 2, size - 2), Image.Resampling.NEAREST)
        alpha = image.getchannel('A')
        image = image.convert('RGB').quantize(colors=24, method=Image.Quantize.MEDIANCUT,
                                              dither=Image.Dither.NONE).convert('RGBA')
        image.putalpha(alpha)
        pixels = image.load()
        for y in range(image.height):
            for x in range(image.width):
                if pixels[x, y][3] == 0:
                    pixels[x, y] = (0, 0, 0, 0)
        sprite = Image.new('RGBA', (size, size))
        sprite.paste(image, ((size - image.width) // 2, (size - image.height) // 2))
        target = output / f'{name}.png'
        sprite.save(target, optimize=True)
        manifest['icons'][name] = {
            'archive': archive, 'entry': entry, 'sourceSha256': hashlib.sha256(data).hexdigest(),
            'crop': crop, 'size': [size, size], 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        }
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared {len(SPECS)} transparent pixel icons in {output}')


if __name__ == '__main__':
    main()
