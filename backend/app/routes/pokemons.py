import requests
import random
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_pokemons():
    pokemons = []
    res = requests.get("https://pokeapi.co/api/v2/pokemon-species?limit=60 ")
    species_list = res.json()["results"]  # Aquí obtenemos la lista real

    for species in species_list:
        species_data = requests.get(species["url"]).json()

        if species_data["evolves_from_species"] is None:
            # Usar nombre en lugar de id para asegurar el endpoint correcto
            pokemon_res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{species_data['name']}")
            if pokemon_res.status_code != 200:
                continue
            pokemon_data = pokemon_res.json()
            types = [t["type"]["name"] for t in pokemon_data["types"]]
            stats = {stat['stat']['name']: stat['base_stat'] for stat in pokemon_data['stats']}
            generation = species_data["generation"]["name"]
            stats = {stat['stat']['name']: stat['base_stat'] for stat in pokemon_data['stats']}
            moves = pokemon_data.get("moves", [])

            pokemons.append({
                "name": pokemon_data["name"],
                "image": pokemon_data["sprites"]["front_default"],
                "types": types,
                "stats": stats,
                "generation": generation,
                "moves": moves
            })

    return {"pokemons": pokemons}


@router.get("/random-pokemon")
def get_random_pokemon():
    random_id = random.randint(1, 1025)

    pokemon_res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{random_id}")
    if pokemon_res.status_code != 200:
        return {"error": "Pokémon no encontrado"}

    pokemon_data = pokemon_res.json()

    # Extraemos los datos que quieres enviar:
    name = pokemon_data["name"]
    sprite = pokemon_data["sprites"]["front_default"]
    types = [t["type"]["name"] for t in pokemon_data["types"]]
    stats = {stat['stat']['name']: stat['base_stat'] for stat in pokemon_data['stats']}
    moves = pokemon_data.get("moves", [])

    pokemon = {
        "name": name,
        "image": sprite,
        "types": types,
        "stats": stats,
        "moves": moves,
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
        if any(t["name"] == d_type for t in relations["double_damage_to"]):
            multiplier *= 2
        elif any(t["name"] == d_type for t in relations["half_damage_to"]):
            multiplier *= 0.5
        elif any(t["name"] == d_type for t in relations["no_damage_to"]):
            multiplier *= 0

    return {"effectiveness": multiplier}