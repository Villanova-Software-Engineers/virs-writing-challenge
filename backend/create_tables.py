from app.core.database import engine, Base
from app.models.semester import Semester

Base.metadata.create_all(bind=engine)
print("Tables created successfully!")