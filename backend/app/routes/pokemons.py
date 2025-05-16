import requests
import random
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_pokemons():
    pokemons = []
    res = requests.get("https://pokeapi.co/api/v2/pokemon-species?limit=60")
    species_list = res.json()["results"]

    for species in species_list:
        species_data = requests.get(species["url"]).json()

        if species_data["evolves_from_species"] is None:
            # Usar nombre en lugar de id para asegurar el endpoint correcto
            pokemon_res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{species_data['name']}")
            if pokemon_res.status_code != 200:
                continue
            pokemon_data = pokemon_res.json()
            print(pokemon_data)
            types = [t["type"]["name"] for t in pokemon_data["types"]]
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