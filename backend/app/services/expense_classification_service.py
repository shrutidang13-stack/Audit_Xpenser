from app.services.ai_service import AIService


RULES = [
    ("Professional fees", ["professional", "consultancy", "technical fee", "advisor"]),
    ("Rent", ["rent", "lease"]),
    ("Freight / transport", ["freight", "transport", "gta", "logistics"]),
    ("Commission / brokerage", ["commission", "brokerage"]),
    ("Contract payment", ["contract", "labour", "job work"]),
    ("Interest / finance cost", ["interest", "finance", "loan processing"]),
    ("Repairs and maintenance", ["repair", "maintenance", "service"]),
    ("Advertisement / sales promotion", ["advertisement", "promotion", "marketing"]),
    ("Travelling", ["travel", "flight", "train", "cab", "ticket"]),
    ("Staff welfare", ["staff welfare", "employee welfare"]),
    ("Hotel / food", ["hotel", "food", "restaurant", "meal"]),
    ("Donation", ["donation", "charity"]),
    ("Penalty / fine", ["penalty", "fine", "late fee", "damages"]),
    ("Statutory dues", ["pf", "esi", "gst paid", "tds paid", "professional tax"]),
    ("Legal fees", ["legal", "advocate", "lawyer"]),
    ("Director-related payment", ["director", "sitting fee"]),
    ("Employee cost", ["salary", "wages", "bonus", "reimbursement"]),
    ("Bank charges", ["bank charge", "bank charges", "neft", "rtgs"]),
    ("Capital item risk", ["laptop", "ac ", "air conditioner", "furniture", "machinery", "equipment", "renovation", "software purchase"]),
    ("Personal / non-business risk", ["personal", "family", "holiday", "gift"]),
]


def classify_text(ledger: str | None, narration: str | None) -> dict:
    haystack = f"{ledger or ''} {narration or ''}".lower()
    for category, keywords in RULES:
        if any(keyword in haystack for keyword in keywords):
            return {"category": category, "confidence": 0.9, "basis": f"Rule keyword match for {category}."}
    return AIService().classify_low_confidence(haystack)
