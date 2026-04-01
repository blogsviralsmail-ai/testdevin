from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/exams", tags=["Exams"])

class ExamCreate(BaseModel):
    session_id: Optional[int] = None
    category_id: Optional[int] = None
    name: str
    exam_date: Optional[str] = None
    exam_time: Optional[str] = None
    venue: Optional[str] = None
    exam_type: str = "regular"
    status: str = "scheduled"
    visibility: str = "all"

class ExamResultCreate(BaseModel):
    exam_id: int
    student_id: int
    marks: Optional[str] = None
    grade: Optional[str] = None
    status: str = "appeared"
    is_mark_back: bool = False

@router.get("")
async def list_exams(session_id: Optional[int] = None, category_id: Optional[int] = None, exam_type: Optional[str] = None, center_id: Optional[int] = None, visibility: Optional[str] = None, user: dict = Depends(get_current_user)):
    conn = get_db()
    query = """SELECT e.*, s.name as session_name, c.name as category_name, u.name as university_name, ct.name as center_name
               FROM exams e LEFT JOIN sessions s ON e.session_id = s.id 
               LEFT JOIN categories c ON e.category_id = c.id
               LEFT JOIN universities u ON c.university_id = u.id
               LEFT JOIN centers ct ON e.center_id = ct.id WHERE 1=1"""
    params = []
    role = user.get("role", "")
    if role == "center":
        # Center sees: admin exams with visibility='all' + own center exams
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        cid = center["id"]
        query += " AND (e.center_id = ? OR (e.center_id IS NULL AND (e.visibility = 'all' OR e.visibility IS NULL)))"
        params.append(cid)
    elif role == "student":
        # Student sees exams relevant to their course
        pass
    else:
        # Admin can filter
        if center_id:
            query += " AND e.center_id = ?"
            params.append(center_id)
        if visibility:
            query += " AND e.visibility = ?"
            params.append(visibility)
    if session_id:
        query += " AND e.session_id = ?"
        params.append(session_id)
    if category_id:
        query += " AND e.category_id = ?"
        params.append(category_id)
    if exam_type:
        query += " AND e.exam_type = ?"
        params.append(exam_type)
    query += " ORDER BY e.exam_date DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{eid}")
async def get_exam(eid: int):
    conn = get_db()
    row = conn.execute("SELECT e.*, s.name as session_name, c.name as category_name FROM exams e LEFT JOIN sessions s ON e.session_id = s.id LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?", (eid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Exam not found")
    return dict(row)

@router.post("")
async def create_exam(data: ExamCreate, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    center_id = None
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        center_id = center["id"]
    elif role not in ("super_admin", "admin", "branch_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to create exams")
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO exams (session_id, category_id, name, exam_date, exam_time, venue, exam_type, status, center_id, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (data.session_id, data.category_id, data.name, data.exam_date, data.exam_time, data.venue, data.exam_type, data.status, center_id, data.visibility)
    )
    conn.commit()
    eid = cursor.lastrowid
    conn.close()
    return {"id": eid, "message": "Exam created"}

@router.put("/{eid}")
async def update_exam(eid: int, data: ExamCreate, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    conn = get_db()
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        exam = conn.execute("SELECT center_id FROM exams WHERE id = ?", (eid,)).fetchone()
        if not exam or exam["center_id"] != center["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Cannot edit this exam")
    elif role not in ("super_admin", "admin", "branch_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    conn.execute(
        "UPDATE exams SET session_id=?, category_id=?, name=?, exam_date=?, exam_time=?, venue=?, exam_type=?, status=?, visibility=? WHERE id=?",
        (data.session_id, data.category_id, data.name, data.exam_date, data.exam_time, data.venue, data.exam_type, data.status, data.visibility, eid)
    )
    conn.commit()
    conn.close()
    return {"message": "Exam updated"}

@router.delete("/{eid}")
async def delete_exam(eid: int, user: dict = Depends(get_current_user)):
    role = user.get("role", "")
    conn = get_db()
    if role == "center":
        from app.routers.centers import get_current_center
        center = get_current_center(user)
        exam = conn.execute("SELECT center_id FROM exams WHERE id = ?", (eid,)).fetchone()
        if not exam or exam["center_id"] != center["id"]:
            conn.close()
            raise HTTPException(status_code=403, detail="Cannot delete this exam")
    elif role not in ("super_admin", "admin", "branch_admin"):
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized")
    conn.execute("DELETE FROM exams WHERE id = ?", (eid,))
    conn.commit()
    conn.close()
    return {"message": "Exam deleted"}

# Exam Results
@router.get("/{eid}/results")
async def get_exam_results(eid: int, branch_id: Optional[int] = None):
    conn = get_db()
    query = """SELECT er.*, st.name as student_name, st.enrollment_no, st.branch_id, b.name as branch_name
               FROM exam_results er JOIN students st ON er.student_id = st.id
               LEFT JOIN branches b ON st.branch_id = b.id WHERE er.exam_id = ?"""
    params = [eid]
    if branch_id:
        query += " AND st.branch_id = ?"
        params.append(branch_id)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/results")
async def add_exam_result(data: ExamResultCreate, user: dict = Depends(require_admin)):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO exam_results (exam_id, student_id, marks, grade, status, is_mark_back) VALUES (?, ?, ?, ?, ?, ?)",
        (data.exam_id, data.student_id, data.marks, data.grade, data.status, int(data.is_mark_back))
    )
    conn.commit()
    rid = cursor.lastrowid
    conn.close()
    return {"id": rid, "message": "Result added"}

@router.get("/student/my-exams")
async def student_my_exams(user: dict = Depends(get_current_user)):
    """Get exams for the current student's course (category_id). Only shows exams matching their enrolled course."""
    conn = get_db()
    uid = int(user.get("sub", 0))
    # Get student's category_id
    student = conn.execute("SELECT category_id FROM students WHERE user_id = ?", (uid,)).fetchone()
    if not student:
        conn.close()
        return []
    cat_id = student["category_id"]
    if not cat_id:
        conn.close()
        return []
    # Get exams for this category (course) OR exams with no category (general exams)
    rows = conn.execute(
        """SELECT e.*, c.name as category_name 
           FROM exams e LEFT JOIN categories c ON e.category_id = c.id 
           WHERE e.category_id = ? 
           ORDER BY e.exam_date DESC""",
        (cat_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/mark-back/list")
async def mark_back_exams(branch_id: Optional[int] = None):
    conn = get_db()
    query = """SELECT er.*, e.name as exam_name, st.name as student_name, st.enrollment_no, b.name as branch_name
               FROM exam_results er JOIN exams e ON er.exam_id = e.id
               JOIN students st ON er.student_id = st.id
               LEFT JOIN branches b ON st.branch_id = b.id
               WHERE er.is_mark_back = 1"""
    params = []
    if branch_id:
        query += " AND st.branch_id = ?"
        params.append(branch_id)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/appeared/list")
async def appeared_students(exam_id: Optional[int] = None, branch_id: Optional[int] = None):
    conn = get_db()
    query = """SELECT er.*, e.name as exam_name, st.name as student_name, st.enrollment_no, b.name as branch_name
               FROM exam_results er JOIN exams e ON er.exam_id = e.id
               JOIN students st ON er.student_id = st.id
               LEFT JOIN branches b ON st.branch_id = b.id WHERE 1=1"""
    params = []
    if exam_id:
        query += " AND er.exam_id = ?"
        params.append(exam_id)
    if branch_id:
        query += " AND st.branch_id = ?"
        params.append(branch_id)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]
