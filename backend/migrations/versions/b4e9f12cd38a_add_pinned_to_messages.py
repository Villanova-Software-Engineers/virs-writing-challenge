"""add_pinned_to_messages

Revision ID: b4e9f12cd38a
Revises: a3c8652bec2d
Create Date: 2026-03-24 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4e9f12cd38a'
down_revision: Union[str, None] = 'a3c8652bec2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_pinned column to messages table
    op.add_column('messages', sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('messages', sa.Column('pinned_at', sa.DateTime(timezone=True), nullable=True))

    # Add index for pinned messages
    op.create_index(op.f('ix_messages_is_pinned'), 'messages', ['is_pinned'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_messages_is_pinned'), table_name='messages')
    op.drop_column('messages', 'pinned_at')
    op.drop_column('messages', 'is_pinned')
