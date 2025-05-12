from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class User(BaseModel):
    username: str
    password: str

fake_users_db = []

@router.post("/register")
def register_user(user: User):
    fake_users_db.append(user)
    return {"message": f"Usuario {user.username} registrado correctamente"}
