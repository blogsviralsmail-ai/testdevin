import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), default="")
    brand = Column(String(255), default="")
    plan = Column(String(50), default="free")
    features = Column(JSON, default=list)
    store_type = Column(String(100), default="")
    monthly_orders = Column(String(50), default="")
    is_active = Column(Boolean, default=True)
    theme = Column(String(10), default="light")
    onboarding = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), default="Admin")
    role = Column(String(50), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class TeamUser(Base):
    __tablename__ = "team_users"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    email = Column(String(255), nullable=False)
    name = Column(String(255), default="")
    role = Column(String(50), default="member")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="")
    assigned_to = Column(Integer, nullable=True)
    status = Column(String(50), default="pending")
    priority = Column(String(20), default="medium")
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
