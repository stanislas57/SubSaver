"""add brute-force protection columns (login lockout + code attempt counters)

Revision ID: 4992bd644783
Revises: be3784d909e9
Create Date: 2026-07-09 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4992bd644783'
down_revision: Union[str, None] = 'be3784d909e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('locked_until', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('reset_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.alter_column('users', 'failed_login_attempts', server_default=None)
    op.alter_column('users', 'verification_attempts', server_default=None)
    op.alter_column('users', 'reset_attempts', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'reset_attempts')
    op.drop_column('users', 'verification_attempts')
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
