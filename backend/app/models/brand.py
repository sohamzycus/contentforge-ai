from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    tagline = Column(String(200))
    description = Column(Text)
    type = Column(String(50), nullable=False)
    target_audience = Column(Text)
    logo_url = Column(Text)
    instagram_handle = Column(String(100))
    whatsapp_link = Column(Text)
    youtube_channel = Column(Text)
    website_url = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="brands")
    items = relationship("Item", back_populates="brand", cascade="all, delete-orphan")
    inventory_items = relationship("InventoryItem", back_populates="brand", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="brand", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="brand", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="brand", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="brand")
