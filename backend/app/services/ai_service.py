from app.core.config import get_settings


class AIService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def classify_low_confidence(self, text: str) -> dict:
        provider = self.settings.ai_provider.lower()
        if provider in {"openai", "gemini"}:
            has_key = self.settings.openai_api_key if provider == "openai" else self.settings.gemini_api_key
            if has_key:
                return {
                    "category": "CA Review Required",
                    "confidence": 0.45,
                    "basis": f"{provider} provider configured; mock structured fallback used in MVP.",
                }
        return {
            "category": "CA Review Required",
            "confidence": 0.35,
            "basis": "Mock AI fallback used because rule confidence was low or provider was unavailable.",
        }
