"""remove_department_column

Revision ID: 93f2578b4d7c
Revises: 00d9108d4095
Create Date: 2026-04-14 22:13:43.887926

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '93f2578b4d7c'
down_revision: Union[str, None] = '00d9108d4095'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('users', 'department')


def downgrade() -> None:
    op.add_column('users', sa.Column('department', sa.VARCHAR(), server_default='', nullable=True))
