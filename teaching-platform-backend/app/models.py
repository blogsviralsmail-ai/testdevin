from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Auth models
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str  # student or teacher
    city: Optional[str] = None
    state: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# Teacher models
class TeacherProfileUpdate(BaseModel):
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    hourly_rate: Optional[float] = None
    languages: Optional[list[str]] = None
    qualification: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None


class AddSubject(BaseModel):
    subject_id: int
    class_levels: list[str] = []


class AvailabilitySlot(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # "09:00"
    end_time: str  # "17:00"


# Class models
class CreateClass(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    class_type: str = "one-on-one"
    scheduled_at: str
    duration_minutes: int = 60
    meeting_link: Optional[str] = None
    max_students: int = 1
    price: float = 0


class UpdateClassStatus(BaseModel):
    status: str


# Booking models
class BookClassRequest(BaseModel):
    class_id: int


class BookTeacherRequest(BaseModel):
    teacher_id: int
    subject_id: int
    scheduled_date: str  # "2026-03-10"
    scheduled_time: str  # "10:00"
    duration_minutes: int = 60
    class_type: str = "one-on-one"
    message: Optional[str] = None
    # Payment card details (fake gateway)
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None
    card_name: Optional[str] = None


# Review models
class CreateReview(BaseModel):
    teacher_id: int
    class_id: int
    rating: int
    comment: Optional[str] = None


# Payment models
class PaymentRequest(BaseModel):
    booking_id: int
    amount: float
    payment_method: str = "wallet"


# Support ticket models
class CreateTicket(BaseModel):
    subject: str
    description: str
    category: str = "general"
    priority: str = "medium"


class TicketReply(BaseModel):
    message: str


class UpdateTicketStatus(BaseModel):
    status: str


# Search models
class TeacherSearch(BaseModel):
    subject: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    class_level: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    language: Optional[str] = None
    page: int = 1
    per_page: int = 10
