"""add renewal_alerts table and users.alert_delay_days

Revision ID: d8e1a5c3f704
Revises: c3b9f6d2a847
Create Date: 2026-07-16 10:00:00.000000

Notifications de renouvellement (in-app + email), 7/10/14 jours avant
échéance selon la préférence utilisateur `alert_delay_days`. Une ligne
`renewal_alerts` = un cycle de renouvellement d'un abonnement ; la contrainte
d'unicité (subscription_id, renewal_date) empêche l'envoi de doublons (cf.
app/models/renewal_alert.py).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd8e1a5c3f704'
down_revision: Union[str, None] = 'c3b9f6d2a847'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('alert_delay_days', sa.Integer(), nullable=False, server_default='7'))

    op.create_table(
        'renewal_alerts',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column(
            'subscription_id',
            sa.String(),
            sa.ForeignKey('subscriptions.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('renewal_date', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('sent_at', sa.String(), nullable=True),
        sa.UniqueConstraint('subscription_id', 'renewal_date', name='uq_renewal_alert_cycle'),
    )


def downgrade() -> None:
    op.drop_table('renewal_alerts')
    op.drop_column('users', 'alert_delay_days')
