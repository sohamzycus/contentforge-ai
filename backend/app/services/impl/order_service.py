import logging
from datetime import date
from typing import List, Optional

from app.core.events import event_bus
from app.core.unit_of_work import IUnitOfWork
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderUpdate
from app.services.interfaces.order_service import IOrderService

logger = logging.getLogger(__name__)

VALID_STATUS_TRANSITIONS = {
    "PENDING": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["READY", "CANCELLED"],
    "READY": ["DELIVERED", "CANCELLED"],
    "DELIVERED": [],
    "CANCELLED": [],
}


class OrderService(IOrderService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def create_order(self, brand_id: int, user_id: int, data: OrderCreate) -> Order:
        with self._uow:
            brand = self._uow.brands.get_by_id(brand_id)
            if not brand:
                raise ValueError("Brand not found")

            prefix = brand.name[:3].upper()
            order_number = self._uow.orders.get_next_order_number(
                brand_id, prefix, date.today()
            )

            order = Order(
                brand_id=brand_id,
                user_id=user_id,
                order_number=order_number,
                customer_name=data.customer_name,
                customer_phone=data.customer_phone,
                source=data.source,
                notes=data.notes,
                discount_amount=data.discount_amount,
            )

            total = 0
            for oi_data in data.items:
                item = self._uow.items.get_by_id(oi_data.item_id)
                if not item:
                    raise ValueError(f"Item {oi_data.item_id} not found")
                line_total = item.unit_price * oi_data.quantity
                order_item = OrderItem(
                    item_id=item.id,
                    quantity=oi_data.quantity,
                    unit_price=item.unit_price,
                    total_price=line_total,
                    notes=oi_data.notes,
                )
                order.items.append(order_item)
                total += line_total

            order.total_amount = total
            order = self._uow.orders.create(order)
            self._uow.commit()
            self._uow.session.refresh(order)

            logger.info("Order created: %s (brand=%d, total=%d)", order_number, brand_id, total)
            return order

    def list_by_brand(
        self, brand_id: int, status: Optional[str] = None, skip: int = 0, limit: int = 100,
    ) -> List[Order]:
        with self._uow:
            return self._uow.orders.get_by_brand(brand_id, status=status, skip=skip, limit=limit)

    def get(self, order_id: int) -> Optional[Order]:
        with self._uow:
            return self._uow.orders.get_by_id(order_id)

    def update(self, order_id: int, data: OrderUpdate) -> Order:
        with self._uow:
            order = self._uow.orders.get_by_id(order_id)
            if not order:
                raise ValueError("Order not found")
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(order, field, value)
            self._uow.orders.update(order)
            self._uow.commit()
            self._uow.session.refresh(order)
            logger.info("Order %s updated", order.order_number)
            return order

    def update_status(self, order_id: int, new_status: str) -> Order:
        with self._uow:
            order = self._uow.orders.get_by_id(order_id)
            if not order:
                raise ValueError("Order not found")

            allowed = VALID_STATUS_TRANSITIONS.get(order.status, [])
            if new_status not in allowed:
                raise ValueError(
                    f"Cannot transition from {order.status} to {new_status}. "
                    f"Allowed: {allowed}"
                )

            order.status = new_status
            self._uow.orders.update(order)
            self._uow.commit()
            self._uow.session.refresh(order)

            if new_status == "DELIVERED":
                event_bus.publish("order.delivered", {
                    "order_id": order.id,
                    "brand_id": order.brand_id,
                    "total_amount": order.total_amount,
                })

            logger.info("Order %s status -> %s", order.order_number, new_status)
            return order

    def delete(self, order_id: int) -> None:
        with self._uow:
            order = self._uow.orders.get_by_id(order_id)
            if not order:
                raise ValueError("Order not found")
            self._uow.orders.delete(order_id)
            self._uow.commit()
            logger.info("Order %s deleted", order.order_number)
