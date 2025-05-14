import requests
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_pokemons():
    pokemons = []
    for i in range(1, 252):
        res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{i}")
        data = res.json()
        pokemons.append({
            "name": data["name"],
            "image": data["sprites"]["front_default"]
        })
    return {"pokemons": pokemons}
