from app.database import engine
from app.routes.models import Base

# Crear todas las tablas
Base.metadata.create_all(bind=engine)
