"""add_session_state_table

Revision ID: 00d9108d4095
Revises: 499e94facd9f
Create Date: 2026-04-12 20:09:33.350382

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00d9108d4095'
down_revision: Union[str, None] = '499e94facd9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'session_states',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('accumulated_seconds', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_running', sa.Boolean(), nullable=False),
        sa.Column('session_start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_pause_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_session_states_id'), 'session_states', ['id'], unique=False)
    op.create_index(op.f('ix_session_states_user_id'), 'session_states', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_session_states_user_id'), table_name='session_states')
    op.drop_index(op.f('ix_session_states_id'), table_name='session_states')
    op.drop_table('session_states')
