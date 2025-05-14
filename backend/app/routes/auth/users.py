# backend/app/routes/auth/users.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.routes.schemas import RegisterRequest, LoginRequest
from app.routes.models import User
from app.database import get_db     # ← Aquí también desde app.database
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    user = db.query(User).filter(User.username == request.username).first()
    if user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    # Crear el nuevo usuario con la contraseña cifrada
    hashed_password = pwd_context.hash(request.password)
    new_user = User(username=request.username, password=hashed_password)
    
    db.add(new_user)
    db.commit()
    
    return {"message": "Usuario registrado con éxito"}

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not pwd_context.verify(request.password, user.password):
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")
    
    return {"message": "Inicio de sesión exitoso", "username": user.username}
