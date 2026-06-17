import platform
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from app.services.utils import clean_text


OCR_TIMEOUT_SECONDS = 45
MAX_OCR_SIDE = 2800
MIN_OCR_SIDE = 1400
OCR_ROTATIONS = [0, 90, 180, 270]


def extract_image_text(path: Path) -> str:
    if platform.system().lower() != "windows":
        raise RuntimeError("Local OCR is configured through Windows OCR and is only available on Windows.")
    script = Path(__file__).with_name("windows_ocr.ps1")
    if not script.exists():
        raise RuntimeError("Windows OCR helper script is missing.")
    with tempfile.TemporaryDirectory(prefix="auditxpenser-ocr-") as temp_dir:
        candidates = []
        last_error = ""
        for rotation in OCR_ROTATIONS:
            prepared = Path(temp_dir) / f"ocr-input-{rotation}.png"
            _prepare_image_for_ocr(path, prepared, rotation)
            completed = _run_windows_ocr(script, prepared)
            if completed.returncode != 0:
                last_error = clean_text(completed.stderr or completed.stdout)
                continue
            text = clean_text(completed.stdout)
            if text:
                candidates.append(text)
        if candidates:
            return max(candidates, key=_ocr_quality_score)
    if last_error:
        raise RuntimeError(last_error or "Windows OCR failed.")
    return ""


def _run_windows_ocr(script: Path, image_path: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(script),
            str(image_path),
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=OCR_TIMEOUT_SECONDS,
        check=False,
    )


def _prepare_image_for_ocr(source: Path, target: Path, rotation: int = 0) -> None:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        if rotation:
            image = image.rotate(rotation, expand=True)
        image = image.convert("L")
        width, height = image.size
        longest = max(width, height)
        shortest = min(width, height)
        scale = 1.0
        if longest > MAX_OCR_SIDE:
            scale = MAX_OCR_SIDE / longest
        elif shortest < MIN_OCR_SIDE:
            scale = MIN_OCR_SIDE / max(shortest, 1)
        if scale != 1.0:
            image = image.resize((max(1, int(width * scale)), max(1, int(height * scale))), Image.Resampling.LANCZOS)
        image = ImageOps.autocontrast(image)
        image = ImageEnhance.Contrast(image).enhance(1.7)
        image = ImageEnhance.Sharpness(image).enhance(1.4)
        image = image.filter(ImageFilter.MedianFilter(size=3))
        image.save(target, format="PNG")


def _ocr_quality_score(text: str) -> int:
    lower = text.lower()
    keywords = [
        "invoice",
        "tax",
        "gst",
        "gstin",
        "amount",
        "total",
        "bill",
        "hsn",
        "sac",
        "private limited",
        "limited",
    ]
    keyword_score = sum(200 for keyword in keywords if keyword in lower)
    digit_score = min(sum(char.isdigit() for char in text), 300)
    return len(text) + keyword_score + digit_score
