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

function Combat() {
  const navigate = useNavigate();
  const location = useLocation();

  const team = location.state?.team || [];
  const [randomPokemon, setRandomPokemon] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/random-pokemon")
      .then(res => res.json())
      .then(data => {
        setRandomPokemon(data?.pokemon || null);
        console.log("Pokemon recibido:", data?.pokemon);
      })
      .catch(err => {
        console.error("Error al conectar con el backend:", err);
        setRandomPokemon(null);
      });
  }, []);

  
  const movesBeforeLevel5 = randomPokemon ? getMovesBeforeLevel(randomPokemon.moves, 70) : [];

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
              <div key={pokemon.name} style={{ /* estilos */ }}>
                {/* Info Pokémon del equipo */}
                <img src={pokemon.image} alt={pokemon.name} style={{ width: '80px' }} />
                <p>{pokemon.name}</p>
                {/* Stats */}
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
                {/* Movimientos */}
                <h4>Movimientos aprendidos antes del nivel 5:</h4>
                <ul>
                  {movesBeforeLevel5Team.length === 0 ? (
                    <li>No tiene movimientos a nivel ≤ 5</li>
                  ) : (
                    movesBeforeLevel5Team.map(move => <li key={move}>{move}</li>)
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Pokémon aleatorio fuera del map */}
      {randomPokemon && (
        <div style={{ marginTop: 40 }}>
          <h3>Pokémon Aleatorio</h3>
          <div style={{ /* estilos */ }}>
            <img src={randomPokemon.image} alt={randomPokemon.name} style={{ width: '100px' }} />
            <p style={{ fontWeight: 'bold', fontSize: 18 }}>{randomPokemon.name}</p>
            <p>Tipos: {randomPokemon.types.join(', ')}</p>
            {/* Stats */}
            {randomPokemon.stats && (
              <div>
                <h4>Stats:</h4>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {Object.entries(randomPokemon.stats).map(([statName, value]) => (
                    <li key={statName}>
                      <strong>{statName.replace("-", " ")}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Movimientos */}
            <h4>Movimientos aprendidos antes del nivel 5:</h4>
            <ul>
              {movesBeforeLevel5.length === 0 ? (
                <li>No tiene movimientos a nivel ≤ 5</li>
              ) : (
                movesBeforeLevel5.map(move => <li key={move}>{move}</li>)
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Combat;
