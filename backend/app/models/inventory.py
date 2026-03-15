from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), index=True)
    unit = Column(String(20), nullable=False)
    current_stock = Column(Float, nullable=False, default=0)
    min_stock = Column(Float, nullable=False, default=0)
    cost_per_unit = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    brand = relationship("Brand", back_populates="inventory_items")
    movements = relationship("InventoryMovement", back_populates="inventory_item", cascade="all, delete-orphan")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)
    quantity = Column(Float, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory_item = relationship("InventoryItem", back_populates="movements")
