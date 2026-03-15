"""Add social/identity fields to brands table

Revision ID: 003
Revises: 002
Create Date: 2026-03-09 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("brands", sa.Column("tagline", sa.String(200)))
    op.add_column("brands", sa.Column("target_audience", sa.Text()))
    op.add_column("brands", sa.Column("instagram_handle", sa.String(100)))
    op.add_column("brands", sa.Column("whatsapp_link", sa.Text()))
    op.add_column("brands", sa.Column("youtube_channel", sa.Text()))
    op.add_column("brands", sa.Column("website_url", sa.Text()))


def downgrade() -> None:
    op.drop_column("brands", "website_url")
    op.drop_column("brands", "youtube_channel")
    op.drop_column("brands", "whatsapp_link")
    op.drop_column("brands", "instagram_handle")
    op.drop_column("brands", "target_audience")
    op.drop_column("brands", "tagline")
