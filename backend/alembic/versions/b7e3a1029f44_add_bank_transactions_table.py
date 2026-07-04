"""add bank transactions table

Revision ID: b7e3a1029f44
Revises: a1c2f9d84e01
Create Date: 2026-07-04 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7e3a1029f44'
down_revision: Union[str, None] = 'a1c2f9d84e01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'bank_transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('powens_transaction_id', sa.String(), nullable=False),
        sa.Column('wording', sa.String(), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('date', sa.String(), nullable=False),
        sa.Column('transaction_type', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'powens_transaction_id', name='uq_user_powens_transaction'),
    )
    op.create_index(op.f('ix_bank_transactions_user_id'), 'bank_transactions', ['user_id'], unique=False)
    op.create_index(
        op.f('ix_bank_transactions_powens_transaction_id'), 'bank_transactions', ['powens_transaction_id'], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_bank_transactions_powens_transaction_id'), table_name='bank_transactions')
    op.drop_index(op.f('ix_bank_transactions_user_id'), table_name='bank_transactions')
    op.drop_table('bank_transactions')
