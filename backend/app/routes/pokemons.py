import requests
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_pokemons():
    pokemons = []
    res = requests.get("https://pokeapi.co/api/v2/pokemon-species?limit=386 ")
    species_list = res.json()["results"]  # Aquí obtenemos la lista real

    for species in species_list:
        species_data = requests.get(species["url"]).json()

        # Queremos solo las primeras evoluciones (que no evolucionan de nadie)
        if species_data["evolves_from_species"] is None:
            # Ahora necesitamos acceder al endpoint del Pokémon para sacar imagen y tipos
            pokemon_res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{species_data['id']}")
            pokemon_data = pokemon_res.json()

            types = [t["type"]["name"] for t in pokemon_data["types"]]
            generation = species_data["generation"]["name"]

            pokemons.append({
                "name": pokemon_data["name"],
                "image": pokemon_data["sprites"]["front_default"],
                "types": types,
                "generation": generation
            })

    return {"pokemons": pokemons}