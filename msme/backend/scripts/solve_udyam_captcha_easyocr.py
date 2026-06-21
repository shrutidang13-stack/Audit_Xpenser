import json
import sys


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "text": "", "error": "captcha image path is required"}))
        return

    image_path = sys.argv[1]
    try:
        import easyocr
        import cv2
    except Exception as exc:
        print(json.dumps({
            "success": False,
            "text": "",
            "error": f"EasyOCR dependencies are not installed: {exc}",
        }))
        return

    try:
        image = cv2.imread(image_path)
        if image is None:
            raise RuntimeError("captcha image could not be read")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 3)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        reader = easyocr.Reader(["en"], gpu=False)
        results = reader.readtext(thresh, detail=0, paragraph=False)
        text = "".join(results).strip().replace(" ", "")
        text = "".join(ch for ch in text if ch.isalnum())
        print(json.dumps({"success": bool(text), "text": text, "error": "" if text else "OCR returned blank text"}))
    except Exception as exc:
        print(json.dumps({"success": False, "text": "", "error": str(exc)}))


if __name__ == "__main__":
    main()
