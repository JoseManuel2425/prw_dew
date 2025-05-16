import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";

function getMovesBeforeLevel(moves, maxLevel = 5) {
  const filteredMoves = moves.filter(moveEntry =>
    moveEntry.version_group_details.some(detail =>
      detail.move_learn_method.name === "level-up" &&
      detail.level_learned_at <= maxLevel
    )
  );
  return filteredMoves.slice(0, 4).map(m => m.move.name);
}

function calculateActualStats(baseStats, level, IVs) {
  const actual = {};

  // Calcular HP real
  actual.hp = Math.floor(((2 * baseStats.hp + IVs.hp) * level) / 100) + level + 10;

  // Calcular resto de stats reales
  ['attack', 'defense', 'special-attack', 'special-defense', 'speed'].forEach(stat => {
    actual[stat] = Math.floor(((2 * baseStats[stat] + IVs[stat]) * level) / 100) + 5;
  });

  return actual;
}

function Combat() {
  const navigate = useNavigate();
  const location = useLocation();

  const team = location.state?.team || [];
  const [randomPokemon, setRandomPokemon] = useState(null);
  const [wildPokemonHP, setWildPokemonHP] = useState(null);

  const generateRandomPokemon = () => {
    fetch("http://localhost:8000/random-pokemon")
      .then(res => res.json())
      .then(data => {
        const pokemon = data?.pokemon;
        if (pokemon) {
          const level = 5;

          const IVs = {
            hp: Math.floor(Math.random() * 32),
            attack: Math.floor(Math.random() * 32),
            defense: Math.floor(Math.random() * 32),
            "special-attack": Math.floor(Math.random() * 32),
            "special-defense": Math.floor(Math.random() * 32),
            speed: Math.floor(Math.random() * 32),
          };

          const realStats = calculateActualStats(pokemon.stats, level, IVs);

          const pokemonWithStats = {
            ...pokemon,
            level,
            IVs,
            stats: realStats
          };

          setRandomPokemon(pokemonWithStats);
          setWildPokemonHP(realStats.hp);
          console.log(IVs);
        } else {
          setRandomPokemon(null);
          setWildPokemonHP(null);
        }
        console.log("Pokemon recibido con stats reales:", pokemon);
      })
      .catch(err => {
        console.error("Error al conectar con el backend:", err);
        setRandomPokemon(null);
        setWildPokemonHP(null);
      });
  };

  useEffect(() => {
    generateRandomPokemon();
  }, []);

  async function fetchEffectiveness(attackingType, defenderTypes) {
    const typesParam = defenderTypes.join(",");
    const res = await fetch(`http://localhost:8000/effectiveness?attacking_type=${attackingType}&defender_types=${typesParam}`);
    const data = await res.json();
    return data.effectiveness || 0;
  }

  async function fightWildPokemon(moveName, yourPokemon) {
    if (!randomPokemon) return; // Por seguridad, que haya pokemon salvaje

    console.log(`¡${yourPokemon.name} usó ${moveName} contra ${randomPokemon.name}!`);

    yourPokemon.IVs = {
            hp: Math.floor(Math.random() * 32),
            attack: Math.floor(Math.random() * 32),
            defense: Math.floor(Math.random() * 32),
            "special-attack": Math.floor(Math.random() * 32),
            "special-defense": Math.floor(Math.random() * 32),
            speed: Math.floor(Math.random() * 32),
          };

    const moveRes = await fetch(`http://localhost:8000/move/${moveName}`);
    const moveData = await moveRes.json();

    const power = moveData.power || 0;
    const accuracy = moveData.accuracy || 100;
    const type = moveData.type;
    const damageType = moveData.damage_class || "physical";

    const effectiveness = await fetchEffectiveness(type, randomPokemon.types);

    const randomNumber = Math.floor(Math.random() * (100 - 85 + 1)) + 85;
    const level = yourPokemon.level || 5;

    const atkCat = damageType === 'special' ? 'special-attack' : 'attack';
    const defCat = damageType === 'special' ? 'special-defense' : 'defense';

    const atk = calculateActualStats(yourPokemon.stats, 5, yourPokemon.IVs)[atkCat];
    const def = calculateActualStats(randomPokemon.stats, 5, randomPokemon.IVs)[defCat];

    const stab = yourPokemon.types.includes(type) ? 1.5 : 1;

    let damage = 0;
    console.log(atk, def);
    if(power != 0) {
      damage = 0.01 * stab * effectiveness * randomNumber *
        ((((0.2 * 5 + 1) * atk * power) / (25 * def)) + 2);
    }

    console.log(`→ Tipo del ataque: ${type}`);
    console.log(`→ Categoría del ataque: ${atkCat}`);
    console.log(`→ IV Pokemon (special-attack): ${yourPokemon.IVs["special-attack"]}`);
    console.log(`→ Efectividad: x${effectiveness}`);
    console.log(`→ Daño calculado: ${Math.round(damage)}`);

    setWildPokemonHP(prevHP => {
      const newHP = Math.max(prevHP - Math.round(damage), 0);
      if (newHP <= 0) {
        console.log(`${randomPokemon.name} ha sido derrotado!`);
        generateRandomPokemon();
      }
      return newHP;
    });

    return damage;
  }

  const movesBeforeLevel5 = randomPokemon ? getMovesBeforeLevel(randomPokemon.moves, 5) : [];

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>¡Combate Pokémon!</h2>

      {team.length === 0 ? (
        <p>No has seleccionado ningún Pokémon aún.</p>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {team.map((pokemon) => {
            const movesBeforeLevel5Team = pokemon.moves ? getMovesBeforeLevel(pokemon.moves, 5) : [];
            return (
              <div key={pokemon.name} style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", width: "180px" }}>
                <img src={pokemon.image} alt={pokemon.name} style={{ width: '80px' }} />
                <p>{pokemon.name}</p>

                {pokemon.stats && (
                  <div>
                    <h4>Stats:</h4>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {Object.entries(pokemon.stats).map(([statName, value]) => (
                        <li key={statName}>
                          <strong>{statName.replace("-", " ")}:</strong> {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <h4>Movimientos aprendidos antes del nivel 5:</h4>
                <ul style={{ paddingLeft: 0 }}>
                  {movesBeforeLevel5Team.length === 0 ? (
                    <li>No tiene movimientos a nivel ≤ 5</li>
                  ) : (
                    movesBeforeLevel5Team.map(move => (
                      <button
                        key={move}
                        style={{ margin: '4px' }}
                        onClick={async () => {
                          await fightWildPokemon(move, pokemon);
                        }}
                      >
                        {move}
                      </button>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {randomPokemon && (
        <div style={{ marginTop: 40 }}>
          <h3>Pokémon Aleatorio</h3>
          <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "8px", display: "inline-block" }}>
            <img src={randomPokemon.image} alt={randomPokemon.name} style={{ width: '100px' }} />
            <p style={{ fontWeight: 'bold', fontSize: 18 }}>{randomPokemon.name}</p>
            <p>Tipos: {randomPokemon.types.join(', ')}</p>
            <p>HP: {wildPokemonHP} / {randomPokemon.stats.hp}</p>
            <h4>Movimientos aprendidos antes del nivel 5:</h4>
            <ul style={{ paddingLeft: 0 }}>
              {movesBeforeLevel5.length === 0 ? (
                <li>No tiene movimientos a nivel ≤ 5</li>
              ) : (
                movesBeforeLevel5.map(move => (
                  <button
                    key={move}
                    style={{ margin: '4px' }}
                    onClick={async () => {
                      // Aquí puedes implementar que el Pokémon salvaje también ataque si quieres
                      // Por ahora no hace nada
                    }}
                  >
                    {move}
                  </button>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Combat;
