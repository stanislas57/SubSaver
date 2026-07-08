"""add settlements

Revision ID: 0c9a080ca9b8
Revises: de2175939a96
Create Date: 2026-07-07

"""
from alembic import op
import sqlalchemy as sa

revision = "0c9a080ca9b8"
down_revision = "de2175939a96"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "settlements",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "from_member_id", sa.String(), sa.ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "to_member_id", sa.String(), sa.ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
    )
    op.create_index("ix_settlements_user_id", "settlements", ["user_id"])
    op.create_index("ix_settlements_from_member_id", "settlements", ["from_member_id"])
    op.create_index("ix_settlements_to_member_id", "settlements", ["to_member_id"])
    op.create_index("ix_settlements_period", "settlements", ["period"])


def downgrade() -> None:
    op.drop_index("ix_settlements_period", table_name="settlements")
    op.drop_index("ix_settlements_to_member_id", table_name="settlements")
    op.drop_index("ix_settlements_from_member_id", table_name="settlements")
    op.drop_index("ix_settlements_user_id", table_name="settlements")
    op.drop_table("settlements")
