from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth
class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class UpdatePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class UpdateUsernameRequest(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class UpdateUserDetailsRequest(BaseModel):
    phone: Optional[str] = None
    address: Optional[dict] = None


# Slots
class CreateSlotRequest(BaseModel):
    name: str
    platform: str  # youtube, facebook, twitch, instagram, custom
    streamKey: str
    rtmpUrl: Optional[str] = None  # for custom RTMP
    videoId: Optional[str] = None  # assign video at creation time
    scheduledStart: Optional[str] = None  # ISO datetime string for auto-start
    scheduledEnd: Optional[str] = None  # ISO datetime string for auto-stop

class UpdateSlotRequest(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    streamKey: Optional[str] = None
    rtmpUrl: Optional[str] = None
    videoId: Optional[str] = None
    scheduledStart: Optional[str] = None  # ISO datetime string for auto-start
    scheduledEnd: Optional[str] = None  # ISO datetime string for auto-stop


# Videos
class ConfirmUploadRequest(BaseModel):
    fileName: str
    fileSize: int
    s3Key: str

class UpdateVideoRequest(BaseModel):
    name: str


# Orders
class OrderSlotItem(BaseModel):
    slotId: Optional[str] = None  # None for new slots
    duration: int
    durationType: str  # day, week, month

class CreateOrderRequest(BaseModel):
    slots: List[OrderSlotItem]
    currency: str = "INR"
    phone: str
    address: dict
    paymentGateway: str = "cashfree"  # cashfree or razorpay


# Admin
class AdminUpdateUserRequest(BaseModel):
    status: Optional[str] = None  # active, banned, suspended
    role: Optional[str] = None

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    durationType: Optional[str] = None
    durationValue: Optional[int] = None
    price: Optional[dict] = None
    features: Optional[List[str]] = None
    streamQuality: Optional[str] = None
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None

class CreateProductRequest(BaseModel):
    name: str
    durationType: str
    durationValue: int = 1
    price: dict
    features: List[str] = []
    streamQuality: str = "1080p"
    isActive: bool = True
    sortOrder: int = 0

class UpdateSettingsRequest(BaseModel):
    brandName: Optional[str] = None
    companyName: Optional[str] = None
    contactEmail: Optional[str] = None
    supportEmail: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    logoUrl: Optional[str] = None
    faviconUrl: Optional[str] = None
    primaryColor: Optional[str] = None
    secondaryColor: Optional[str] = None
    heroTitle: Optional[str] = None
    heroSubtitle: Optional[str] = None
    footerText: Optional[str] = None
    socialLinks: Optional[dict] = None
    gstRate: Optional[float] = None
    gstNumber: Optional[str] = None
    maintenanceMode: Optional[bool] = None
    currency: Optional[str] = None
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None

class ContactMessageRequest(BaseModel):
    name: str
    email: EmailStr
    message: str
