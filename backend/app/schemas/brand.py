from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BrandCreate(BaseModel):
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    type: str
    target_audience: Optional[str] = None
    logo_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    whatsapp_link: Optional[str] = None
    youtube_channel: Optional[str] = None
    website_url: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    target_audience: Optional[str] = None
    logo_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    whatsapp_link: Optional[str] = None
    youtube_channel: Optional[str] = None
    website_url: Optional[str] = None


class Brand(BaseModel):
    id: int
    user_id: int
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    type: str
    target_audience: Optional[str] = None
    logo_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    whatsapp_link: Optional[str] = None
    youtube_channel: Optional[str] = None
    website_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BrandList(BaseModel):
    id: int
    name: str
    tagline: Optional[str] = None
    type: str
    instagram_handle: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
