from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/form-fields", tags=["Form Fields"])

class FormFieldCreate(BaseModel):
    university_id: int
    field_name: str
    field_label: str
    field_type: str = "text"
    is_mandatory: bool = False
    field_order: int = 0
    options: Optional[str] = None
    placeholder: Optional[str] = None
    section: str = "Personal Details"

class FormFieldBulkCreate(BaseModel):
    university_id: int
    fields: List[FormFieldCreate]

@router.get("/{university_id}")
async def get_form_fields(university_id: int):
    conn = get_db()
    rows = conn.execute("SELECT * FROM form_fields WHERE university_id = ? ORDER BY field_order", (university_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
async def create_form_field(data: FormFieldCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO form_fields (university_id, field_name, field_label, field_type, is_mandatory, field_order, options, placeholder, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.university_id, data.field_name, data.field_label, data.field_type, int(data.is_mandatory), data.field_order, data.options, data.placeholder, data.section)
    )
    conn.commit()
    fid = cursor.lastrowid
    conn.close()
    return {"id": fid, "message": "Form field created"}

@router.post("/bulk")
async def bulk_create_fields(data: FormFieldBulkCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    # Delete existing fields for this university
    conn.execute("DELETE FROM form_fields WHERE university_id = ?", (data.university_id,))
    for f in data.fields:
        conn.execute(
            "INSERT INTO form_fields (university_id, field_name, field_label, field_type, is_mandatory, field_order, options, placeholder, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (data.university_id, f.field_name, f.field_label, f.field_type, int(f.is_mandatory), f.field_order, f.options, f.placeholder, f.section)
        )
    conn.commit()
    conn.close()
    return {"message": f"{len(data.fields)} form fields saved"}

@router.put("/{fid}")
async def update_form_field(fid: int, data: FormFieldCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute(
        "UPDATE form_fields SET field_name=?, field_label=?, field_type=?, is_mandatory=?, field_order=?, options=?, placeholder=?, section=? WHERE id=?",
        (data.field_name, data.field_label, data.field_type, int(data.is_mandatory), data.field_order, data.options, data.placeholder, data.section, fid)
    )
    conn.commit()
    conn.close()
    return {"message": "Form field updated"}

@router.delete("/{fid}")
async def delete_form_field(fid: int, user: dict = Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM form_fields WHERE id = ?", (fid,))
    conn.commit()
    conn.close()
    return {"message": "Form field deleted"}
