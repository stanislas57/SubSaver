"""add subscription_splits and subscriptions.split_mode

Revision ID: de2175939a96
Revises: a2a825c14fd7
Create Date: 2026-07-07

"""
from alembic import op
import sqlalchemy as sa

revision = "de2175939a96"
down_revision = "a2a825c14fd7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column("split_mode", sa.String(), nullable=False, server_default="equal"),
    )
    op.alter_column("subscriptions", "split_mode", server_default=None)

    op.create_table(
        "subscription_splits",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "subscription_id",
            sa.String(),
            sa.ForeignKey("subscriptions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "family_member_id",
            sa.String(),
            sa.ForeignKey("family_members.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("share_value", sa.Float(), nullable=True),
        sa.UniqueConstraint("subscription_id", "family_member_id", name="uq_split_subscription_member"),
    )
    op.create_index(
        "ix_subscription_splits_subscription_id", "subscription_splits", ["subscription_id"]
    )
    op.create_index(
        "ix_subscription_splits_family_member_id", "subscription_splits", ["family_member_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_subscription_splits_family_member_id", table_name="subscription_splits")
    op.drop_index("ix_subscription_splits_subscription_id", table_name="subscription_splits")
    op.drop_table("subscription_splits")
    op.drop_column("subscriptions", "split_mode")
