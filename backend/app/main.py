import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.pokemons import router as pokemons_router
from app.routes.auth.users import router as auth_router
from app.database import Base, engine
from app.routes.auth import users

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pokemons_router, prefix="/pokemons", tags=["pokemons"])
app.include_router(auth_router,    prefix="/auth",     tags=["auth"])
# app.include_router(users.router)

# @app.on_event("startup")
# def on_startup():
#     for i in range(10):
#         try:
#             Base.metadata.create_all(bind=engine)
#             print("✅ Tablas creadas correctamente")
#             break
#         except Exception as e:
#             print(f"❌ Base de datos no lista (intento {i+1}/10): {e}")
#             time.sleep(2)
