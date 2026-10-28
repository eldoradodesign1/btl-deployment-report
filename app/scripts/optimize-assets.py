from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "client" / "public" / "assets"
BACKUP_DIR = Path("/home/ubuntu/webdev-static-assets/original-vodacom-assets")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def optimize(name: str, max_size: tuple[int, int], colors: int) -> None:
    source = ASSET_DIR / name
    backup = BACKUP_DIR / name
    if not backup.exists():
        backup.write_bytes(source.read_bytes())

    with Image.open(source) as image:
        image = image.convert("RGBA")
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        image = image.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
        image.save(source, format="PNG", optimize=True)

    print(f"{name}: {source.stat().st_size} bytes; original backup: {backup}")


if __name__ == "__main__":
    optimize("vodacom-opaline-hero.png", (1800, 1100), 256)
    optimize("vodacom-opaline-logo.png", (640, 640), 128)
