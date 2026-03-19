from pydantic import BaseModel
from typing import Optional, List


class AdminLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CategoryCreate(BaseModel):
    name: str
    name_hi: str
    slug: str
    description: str = ""
    description_hi: str = ""
    image_url: str = ""
    sort_order: int = 0
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    name_hi: Optional[str] = None
    description: Optional[str] = None
    description_hi: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class DesignCreate(BaseModel):
    title: str
    title_hi: str
    slug: str
    category_id: int
    description: str = ""
    description_hi: str = ""
    weight_grams: float = 0
    purity: str = "22K"
    price_range: str = ""
    images: List[str] = []
    tags: str = ""
    is_featured: bool = False
    is_active: bool = True


class DesignUpdate(BaseModel):
    title: Optional[str] = None
    title_hi: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    description_hi: Optional[str] = None
    weight_grams: Optional[float] = None
    purity: Optional[str] = None
    price_range: Optional[str] = None
    images: Optional[List[str]] = None
    tags: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class GoldRateCreate(BaseModel):
    date: str
    gold_24k: float
    gold_22k: float
    gold_18k: float
    silver_rate: float
    city: str = "Jaipur"


class BlogCreate(BaseModel):
    title: str
    title_hi: str
    slug: str
    content: str
    content_hi: str
    excerpt: str = ""
    excerpt_hi: str = ""
    image_url: str = ""
    category: str = "general"
    tags: str = ""
    is_published: bool = False


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    title_hi: Optional[str] = None
    content: Optional[str] = None
    content_hi: Optional[str] = None
    excerpt: Optional[str] = None
    excerpt_hi: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    is_published: Optional[bool] = None


class SettingUpdate(BaseModel):
    key: str
    value: str
