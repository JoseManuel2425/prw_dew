import requests
import random
from fastapi import APIRouter
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
# Reutilizamos una sesión para mantener conexiones HTTP
session = requests.Session()

@router.get("/")
def get_pokemons():
    pokemons = []
    # Llamada inicial para obtener especies
    res = session.get("https://pokeapi.co/api/v2/pokemon-species?limit=1025")
    res.raise_for_status()
    species_list = res.json()["results"]

    def fetch_data(species):
        try:
            sd = session.get(species["url"]).json()
            if sd.get("evolves_from_species") is not None:
                return None

            pr = session.get(f"https://pokeapi.co/api/v2/pokemon/{sd['name']}")
            if pr.status_code != 200:
                return None

            pd = pr.json()
            return {
                "name": pd["name"],
                "image": pd["sprites"]["front_default"],
                "types": [t["type"]["name"] for t in pd["types"]],
                "stats": {st["stat"]["name"]: st["base_stat"] for st in pd["stats"]},
                "generation": sd["generation"]["name"],
                "moves": pd.get("moves", [])
            }
        except Exception:
            return None

    # Paralelizamos con un pool de threads
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(fetch_data, species_list)

    pokemons = [p for p in results if p]
    return {"pokemons": pokemons}

@router.get("/random-pokemon")
def get_random_pokemon():
    random_id = random.randint(1, 1025)
    pokemon_res = session.get(f"https://pokeapi.co/api/v2/pokemon/138")
    if pokemon_res.status_code != 200:
        return {"error": "Pokémon no encontrado"}

    pokemon_data = pokemon_res.json()
    pokemon = {
        "name": pokemon_data["name"],
        "image": pokemon_data["sprites"]["front_default"],
        "types": [t["type"]["name"] for t in pokemon_data["types"]],
        "stats": {st["stat"]["name"]: st["base_stat"] for st in pokemon_data["stats"]},
        "moves": pokemon_data.get("moves", []),
    }
    return {"pokemon": pokemon}

@router.get("/move/{move_name}")
def get_move_data(move_name: str):
    url = f"https://pokeapi.co/api/v2/move/{move_name.lower()}"
    res = requests.get(url)

    if res.status_code != 200:
        return {"error": f"Movimiento '{move_name}' no encontrado."}

    data = res.json()
    return {
        "name": data["name"],
        "power": data["power"],
        "type": data["type"]["name"],
        "damage_class": data["damage_class"]["name"],
        "accuracy": data["accuracy"],
        "pp": data["pp"],
        "effect": data["effect_entries"][0]["short_effect"] if data["effect_entries"] else None,
    }

@router.get("/effectiveness")
def get_type_effectiveness(attacking_type: str, defender_types: str):
    """
    attacking_type: tipo del ataque, por ejemplo 'fire'
    defender_types: string separado por comas con los tipos del defensor, ej: 'grass,steel'
    """
    res = requests.get(f"https://pokeapi.co/api/v2/type/{attacking_type.lower()}")
    if res.status_code != 200:
        return {"error": "Tipo de ataque inválido"}

    data = res.json()
    relations = data["damage_relations"]
    defender_types = defender_types.lower().split(",")

    multiplier = 1
    for d_type in defender_types:
        print(d_type)
        if any(t["name"] == d_type for t in relations["double_damage_to"]):
            multiplier *= 2
            print("Daño 2 " + str(multiplier))
        elif any(t["name"] == d_type for t in relations["half_damage_to"]):
            multiplier *= 0.5
            print("Daño 0.5 " + str(multiplier))
        elif any(t["name"] == d_type for t in relations["no_damage_to"]):
            multiplier *= 0

    return {"effectiveness": multiplier}