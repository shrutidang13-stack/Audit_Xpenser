from pydantic import BaseModel


class ClientCreate(BaseModel):
    name: str
    pan: str | None = None
    gstin: str | None = None
    financial_year: str = "2025-26"


class MappingItem(BaseModel):
    source_column: str
    target_field: str


class MappingConfirm(BaseModel):
    mappings: list[MappingItem]


class ReviewPatch(BaseModel):
    status: str | None = None
    comment: str | None = None
