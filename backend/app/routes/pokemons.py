import requests
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_pokemons():
    pokemons = []
<<<<<<< Updated upstream
    for i in range(1, 152):
=======
    # res1 = request.get("https://pokeapi.co/api/v2/pokemon?limit=252&offset=0")
    for i in range(1, 11):
>>>>>>> Stashed changes
        res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{i}")
        data = res.json()
        pokemons.append({
            "name": data["name"],
            "image": data["sprites"]["front_default"]
        })
    return {"pokemons": pokemons}
