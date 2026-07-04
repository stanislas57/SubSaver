"""add powens columns

Revision ID: a1c2f9d84e01
Revises: 9109338c326b
Create Date: 2026-07-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1c2f9d84e01'
down_revision: Union[str, None] = '9109338c326b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('powens_user_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('powens_connection_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'powens_connection_id')
    op.drop_column('users', 'powens_user_token')
