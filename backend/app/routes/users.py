from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.hash import bcrypt

router = APIRouter()

class User(BaseModel):
    username: str
    password: str

fake_users_db = []

@router.post("/register")
def register_user(user: User):
    # Verificar usuario único
    if any(u['username'] == user.username for u in fake_users_db):
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    # Validar longitud de contraseña
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    # Guardar usuario con contraseña hasheada
    hashed_password = bcrypt.hash(user.password)
    fake_users_db.append({"username": user.username, "password": hashed_password})
    return {"message": f"Usuario {user.username} registrado correctamente"}

@router.post("/login")
def login(user: User):
    for u in fake_users_db:
        if u['username'] == user.username and bcrypt.verify(user.password, u['password']):
            return {"message": "Login exitoso"}
    raise HTTPException(status_code=401, detail="Credenciales incorrectas")