from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, TeamUser, Task, ActivityLog
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/team", tags=["team"])


class InviteReq(BaseModel):
    email: str
    name: str = ""
    role: str = "member"


class TaskReq(BaseModel):
    title: str
    description: str = ""
    assigned_to: Optional[int] = None
    priority: str = "medium"
    due_date: Optional[str] = None


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    priority: Optional[str] = None


@router.get("/")
def list_team(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    members = db.query(TeamUser).filter(TeamUser.account_id == user.id).all()
    return {
        "team": [
            {"id": m.id, "email": m.email, "name": m.name, "role": m.role, "is_active": m.is_active, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in members
        ],
        "owner": {"id": user.id, "email": user.email, "name": user.name, "role": "owner"},
    }


@router.post("/invite")
def invite_member(req: InviteReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(TeamUser).filter(TeamUser.account_id == user.id, TeamUser.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Member already exists")
    m = TeamUser(account_id=user.id, email=req.email, name=req.name, role=req.role)
    db.add(m)
    db.commit()
    return {"status": "ok", "member_id": m.id}


@router.delete("/{member_id}")
def remove_member(member_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.query(TeamUser).filter(TeamUser.id == member_id, TeamUser.account_id == user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(m)
    db.commit()
    return {"status": "ok"}


@router.put("/{member_id}/role")
def update_role(member_id: int, req: InviteReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.query(TeamUser).filter(TeamUser.id == member_id, TeamUser.account_id == user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    m.role = req.role
    db.commit()
    return {"status": "ok"}


# --- Tasks ---
@router.get("/tasks")
def list_tasks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.account_id == user.id).order_by(Task.created_at.desc()).all()
    return {
        "tasks": [
            {"id": t.id, "title": t.title, "description": t.description, "assigned_to": t.assigned_to, "status": t.status, "priority": t.priority, "due_date": t.due_date.isoformat() if t.due_date else None, "created_at": t.created_at.isoformat() if t.created_at else None}
            for t in tasks
        ]
    }


@router.post("/tasks")
def create_task(req: TaskReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = Task(account_id=user.id, title=req.title, description=req.description, assigned_to=req.assigned_to, priority=req.priority)
    db.add(t)
    db.commit()
    return {"status": "ok", "task_id": t.id}


@router.put("/tasks/{task_id}")
def update_task(task_id: int, req: TaskUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == task_id, Task.account_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    if req.status:
        t.status = req.status
    if req.assigned_to is not None:
        t.assigned_to = req.assigned_to
    if req.priority:
        t.priority = req.priority
    db.commit()
    return {"status": "ok"}


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == task_id, Task.account_id == user.id).first()
    if t:
        db.delete(t)
        db.commit()
    return {"status": "ok"}


# --- Activity ---
@router.get("/activity")
def activity_log(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).filter(ActivityLog.account_id == user.id).order_by(ActivityLog.created_at.desc()).limit(50).all()
    return {
        "activities": [
            {"id": l.id, "action": l.action, "details": l.details, "user_id": l.user_id, "created_at": l.created_at.isoformat() if l.created_at else None}
            for l in logs
        ]
    }
