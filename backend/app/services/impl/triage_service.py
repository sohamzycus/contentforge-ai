import logging
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import func

from app.core.unit_of_work import IUnitOfWork
from app.models.order import Order, OrderItem
from app.models.item import Item
from app.schemas.summary import BrandTriageSummary, CombinedTriageSummary
from app.services.interfaces.triage_service import ITriageService

logger = logging.getLogger(__name__)


class TriageService(ITriageService):

    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def get_daily_triage(self, user_id: int, target_date: date) -> CombinedTriageSummary:
        with self._uow:
            brands = self._uow.brands.get_by_user(user_id)
            brand_summaries = []
            total_orders = 0
            total_revenue = 0
            total_expenses = 0
            total_content = 0

            prev_date = target_date - timedelta(days=7)

            for brand in brands:
                orders_today = self._uow.orders.count_by_brand_and_date(brand.id, target_date)
                income = self._uow.transactions.sum_by_brand_and_date(brand.id, "INCOME", target_date)
                expenses = self._uow.transactions.sum_by_brand_and_date(brand.id, "EXPENSE", target_date)
                content_count = self._uow.projects.count_by_brand_and_date(brand.id, target_date)
                low_stock = self._uow.inventory_items.get_low_stock(brand.id)

                top_item = self._get_top_item(brand.id, target_date)

                summary = BrandTriageSummary(
                    brand_id=brand.id,
                    brand_name=brand.name,
                    orders_today=orders_today,
                    revenue_today=income,
                    expenses_today=expenses,
                    profit_today=income - expenses,
                    content_generated_today=content_count,
                    low_stock_count=len(low_stock),
                    top_item=top_item,
                )
                brand_summaries.append(summary)

                total_orders += orders_today
                total_revenue += income
                total_expenses += expenses
                total_content += content_count

            prev_week_revenue = 0
            for brand in brands:
                prev_week_revenue += self._uow.transactions.sum_by_brand_and_range(
                    brand.id, "INCOME", prev_date, target_date - timedelta(days=1),
                )

            wow_growth = 0.0
            if prev_week_revenue > 0:
                wow_growth = round(((total_revenue - prev_week_revenue) / prev_week_revenue) * 100, 1)

            return CombinedTriageSummary(
                date=target_date,
                brands=brand_summaries,
                combined={
                    "total_orders": total_orders,
                    "total_revenue": total_revenue,
                    "total_profit": total_revenue - total_expenses,
                    "total_content_pieces": total_content,
                    "week_over_week_growth": wow_growth,
                },
            )

    def _get_top_item(self, brand_id: int, target_date: date) -> Optional[str]:
        """Find the best-selling item for a brand on a given date."""
        session = self._uow.session
        result = (
            session.query(Item.name, func.sum(OrderItem.quantity).label("qty"))
            .join(OrderItem, OrderItem.item_id == Item.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(
                Order.brand_id == brand_id,
                func.date(Order.created_at) == target_date,
            )
            .group_by(Item.name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .first()
        )
        return result[0] if result else None
