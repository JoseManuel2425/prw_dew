import sys
import os

# Agrega el directorio raíz del proyecto al sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))

from app.database import engine
from app.routes.models import Base

# Crear todas las tablas
Base.metadata.create_all(bind=engine)
