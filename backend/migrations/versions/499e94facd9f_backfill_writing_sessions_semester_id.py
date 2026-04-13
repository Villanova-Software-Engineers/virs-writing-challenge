"""backfill_writing_sessions_semester_id

Revision ID: 499e94facd9f
Revises: c5f1a23de49b
Create Date: 2026-04-12 19:59:53.068350

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '499e94facd9f'
down_revision: Union[str, None] = 'c5f1a23de49b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Backfill writing_sessions table with semester_id values.
    Assigns all existing writing_sessions to the active semester or Legacy semester.
    """
    connection = op.get_bind()

    # Check for active semester first
    result = connection.execute(
        sa.text("SELECT id FROM semesters WHERE is_active = true LIMIT 1")
    )
    active_semester = result.scalar()

    if active_semester:
        # Assign all existing writing_sessions to the active semester
        connection.execute(
            sa.text("UPDATE writing_sessions SET semester_id = :sid WHERE semester_id IS NULL"),
            {"sid": active_semester}
        )
    else:
        # No active semester - check for Legacy semester or create one
        result = connection.execute(
            sa.text("SELECT id FROM semesters WHERE name = 'Legacy Data' LIMIT 1")
        )
        legacy_id = result.scalar()

        if not legacy_id:
            # Create Legacy semester if it doesn't exist
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
                sa.text("UPDATE writing_sessions SET semester_id = :sid WHERE semester_id IS NULL"),
                {"sid": legacy_id}
            )


def downgrade() -> None:
    """
    Downgrade is a no-op since we're just backfilling existing data.
    We don't want to null out semester_id values on downgrade.
    """
    pass
