"""add_semester_id_to_streaks_messages_comments

Revision ID: c5f1a23de49b
Revises: 4ef15e2ad696
Create Date: 2025-04-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5f1a23de49b'
down_revision: Union[str, None] = '4ef15e2ad696'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove unique constraint on streaks.user_id to allow multiple streaks per user (one per semester)
    # Check if constraint exists before dropping
    connection = op.get_bind()
    constraint_exists = connection.execute(
        sa.text("SELECT 1 FROM pg_constraint WHERE conname = 'streaks_user_id_key' AND conrelid = 'streaks'::regclass")
    ).scalar()

    if constraint_exists:
        op.drop_constraint('streaks_user_id_key', 'streaks', type_='unique')

    # Add semester_id to streaks table
    op.add_column('streaks', sa.Column('semester_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_streaks_semester_id',
        'streaks', 'semesters',
        ['semester_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index(op.f('ix_streaks_semester_id'), 'streaks', ['semester_id'], unique=False)

    # Add semester_id to messages table
    op.add_column('messages', sa.Column('semester_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_messages_semester_id',
        'messages', 'semesters',
        ['semester_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index(op.f('ix_messages_semester_id'), 'messages', ['semester_id'], unique=False)

    # Add semester_id to comments table
    op.add_column('comments', sa.Column('semester_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_comments_semester_id',
        'comments', 'semesters',
        ['semester_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index(op.f('ix_comments_semester_id'), 'comments', ['semester_id'], unique=False)

    # Backfill: Create a "Legacy" semester for old data if it doesn't exist,
    # then assign all existing records to the active semester (or legacy if none active)

    # Check for active semester first
    result = connection.execute(
        sa.text("SELECT id FROM semesters WHERE is_active = true LIMIT 1")
    )
    active_semester = result.scalar()

    if active_semester:
        # Assign all existing records to the active semester
        connection.execute(
            sa.text("UPDATE streaks SET semester_id = :sid WHERE semester_id IS NULL"),
            {"sid": active_semester}
        )
        connection.execute(
            sa.text("UPDATE messages SET semester_id = :sid WHERE semester_id IS NULL"),
            {"sid": active_semester}
        )
        connection.execute(
            sa.text("UPDATE comments SET semester_id = :sid WHERE semester_id IS NULL"),
            {"sid": active_semester}
        )
    else:
        # No active semester - create a Legacy semester
        connection.execute(
            sa.text("""
                INSERT INTO semesters (name, access_code, is_active, auto_clear, created_at)
                VALUES ('Legacy Data', 'LEGACY-NO-ACCESS', false, false, NOW())
                ON CONFLICT DO NOTHING
            """)
        )
        result = connection.execute(
            sa.text("SELECT id FROM semesters WHERE name = 'Legacy Data' LIMIT 1")
        )
        legacy_id = result.scalar()

        if legacy_id:
            connection.execute(
                sa.text("UPDATE streaks SET semester_id = :sid WHERE semester_id IS NULL"),
                {"sid": legacy_id}
            )
            connection.execute(
                sa.text("UPDATE messages SET semester_id = :sid WHERE semester_id IS NULL"),
                {"sid": legacy_id}
            )
            connection.execute(
                sa.text("UPDATE comments SET semester_id = :sid WHERE semester_id IS NULL"),
                {"sid": legacy_id}
            )


def downgrade() -> None:
    # Drop foreign keys and indexes
    op.drop_index(op.f('ix_comments_semester_id'), table_name='comments')
    op.drop_constraint('fk_comments_semester_id', 'comments', type_='foreignkey')
    op.drop_column('comments', 'semester_id')

    op.drop_index(op.f('ix_messages_semester_id'), table_name='messages')
    op.drop_constraint('fk_messages_semester_id', 'messages', type_='foreignkey')
    op.drop_column('messages', 'semester_id')

    op.drop_index(op.f('ix_streaks_semester_id'), table_name='streaks')
    op.drop_constraint('fk_streaks_semester_id', 'streaks', type_='foreignkey')
    op.drop_column('streaks', 'semester_id')

    # Restore unique constraint on streaks.user_id
    op.create_unique_constraint('streaks_user_id_key', 'streaks', ['user_id'])
