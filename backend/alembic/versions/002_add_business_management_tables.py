"""Add business management tables and brand_id to projects

Revision ID: 002
Revises: 001
Create Date: 2026-03-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "brands",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("logo_url", sa.Text()),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_brands_id", "brands", ["id"])
    op.create_index("ix_brands_user_id", "brands", ["user_id"])

    op.create_table(
        "items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("brand_id", sa.Integer(), sa.ForeignKey("brands.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("cost_price", sa.Integer()),
        sa.Column("unit", sa.String(20), server_default="piece", nullable=False),
        sa.Column("image_url", sa.Text()),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_items_id", "items", ["id"])
    op.create_index("ix_items_brand_id", "items", ["brand_id"])
    op.create_index("ix_items_category", "items", ["category"])

    op.create_table(
        "inventory_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("brand_id", sa.Integer(), sa.ForeignKey("brands.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category", sa.String(50)),
        sa.Column("unit", sa.String(20), nullable=False),
        sa.Column("current_stock", sa.Float(), server_default="0", nullable=False),
        sa.Column("min_stock", sa.Float(), server_default="0", nullable=False),
        sa.Column("cost_per_unit", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_inventory_items_id", "inventory_items", ["id"])
    op.create_index("ix_inventory_items_brand_id", "inventory_items", ["brand_id"])

    op.create_table(
        "inventory_movements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("inventory_item_id", sa.Integer(), sa.ForeignKey("inventory_items.id"), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_inventory_movements_id", "inventory_movements", ["id"])
    op.create_index("ix_inventory_movements_item_id", "inventory_movements", ["inventory_item_id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("brand_id", sa.Integer(), sa.ForeignKey("brands.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("order_number", sa.String(20), unique=True, nullable=False),
        sa.Column("customer_name", sa.String(200)),
        sa.Column("customer_phone", sa.String(20)),
        sa.Column("source", sa.String(20), server_default="WALKIN", nullable=False),
        sa.Column("status", sa.String(20), server_default="PENDING", nullable=False),
        sa.Column("total_amount", sa.Integer(), server_default="0", nullable=False),
        sa.Column("discount_amount", sa.Integer(), server_default="0", nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_orders_id", "orders", ["id"])
    op.create_index("ix_orders_brand_id", "orders", ["brand_id"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_user_id", "orders", ["user_id"])

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("item_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("total_price", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text()),
    )
    op.create_index("ix_order_items_id", "order_items", ["id"])
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_item_id", "order_items", ["item_id"])

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("brand_id", sa.Integer(), sa.ForeignKey("brands.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("payment_method", sa.String(20)),
        sa.Column("description", sa.Text()),
        sa.Column("transaction_date", sa.Date(), server_default=sa.func.current_date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_transactions_id", "transactions", ["id"])
    op.create_index("ix_transactions_brand_id", "transactions", ["brand_id"])
    op.create_index("ix_transactions_type", "transactions", ["type"])

    op.create_table(
        "investments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("brand_id", sa.Integer(), sa.ForeignKey("brands.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("invested_at", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_investments_id", "investments", ["id"])
    op.create_index("ix_investments_brand_id", "investments", ["brand_id"])

    op.add_column("projects", sa.Column("brand_id", sa.Integer(), sa.ForeignKey("brands.id"), nullable=True))
    op.create_index("ix_projects_brand_id", "projects", ["brand_id"])


def downgrade() -> None:
    op.drop_index("ix_projects_brand_id", table_name="projects")
    op.drop_column("projects", "brand_id")
    op.drop_table("investments")
    op.drop_table("transactions")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("inventory_movements")
    op.drop_table("inventory_items")
    op.drop_table("items")
    op.drop_table("brands")
