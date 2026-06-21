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
    file_ids: list[int] | None = None
    generate_processing: bool = True


class AuditRunRequest(BaseModel):
    file_ids: list[int] | None = None


class GSTRecoRunRequest(BaseModel):
    gstr_file_id: int | None = None
    books_file_id: int | None = None
    amount_tolerance: float = 2
    date_tolerance_days: int = 7


class ReviewPatch(BaseModel):
    status: str | None = None
    comment: str | None = None
