import requests
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_pokemons():
    pokemons = []
    for i in range(1, 252):  # Solo los 151 originales
        res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{i}")
        data = res.json()
        # Obtener tipos
        types = [t["type"]["name"] for t in data["types"]]
        # Obtener generación (requiere otra petición)
        species_url = data["species"]["url"]
        species_data = requests.get(species_url).json()
        generation = species_data["generation"]["name"]  # Ej: 'generation-i'
        pokemons.append({
            "name": data["name"],
            "image": data["sprites"]["front_default"],
            "types": types,
            "generation": generation
        })
    return {"pokemons": pokemons}