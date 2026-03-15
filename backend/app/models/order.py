from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_number = Column(String(20), unique=True, nullable=False)
    customer_name = Column(String(200))
    customer_phone = Column(String(20))
    source = Column(String(20), nullable=False, default="WALKIN")
    status = Column(String(20), nullable=False, default="PENDING", index=True)
    total_amount = Column(Integer, nullable=False, default=0)
    discount_amount = Column(Integer, nullable=False, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    brand = relationship("Brand", back_populates="orders")
    owner = relationship("User")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")
    transactions = relationship("Transaction", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)
    total_price = Column(Integer, nullable=False)
    notes = Column(Text)

    order = relationship("Order", back_populates="items")
    item = relationship("Item", back_populates="order_items", lazy="joined")

    @property
    def item_name(self) -> str | None:
        return self.item.name if self.item else None
