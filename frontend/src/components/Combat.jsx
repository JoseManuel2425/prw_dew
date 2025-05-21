import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";

function getMovesBeforeLevel(moves, maxLevel = 5) {
  // Si el movimiento fue aprendido manualmente (version_group_details vacío), inclúyelo siempre
  const filteredMoves = moves.filter(moveEntry =>
    moveEntry.version_group_details.length === 0 ||
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

// Ayudante recursivo para encontrar la evolución
function findNextEvolution(chain, currentName) {
  if (chain.species.name === currentName) {
    return chain.evolves_to[0]?.evolution_details[0]
      ? {
        ...chain.evolves_to[0].evolution_details[0],
        species: chain.evolves_to[0].species
      }
      : null;
  }

  for (const child of chain.evolves_to) {
    const result = findNextEvolution(child, currentName);
    if (result) return result;
  }

  return null;
}

async function checkEvolution(currentPokemon) {
  // 1. Obtén la cadena de evolución
  const res = await fetch(`http://localhost:8000/evolution/${currentPokemon.name}`);
  const evoChain = await res.json();

  // 2. Busca si hay una evolución disponible
  const evolution = findNextEvolution(evoChain.chain, currentPokemon.name);

  // 3. Si hay evolución y cumple el nivel, pide los datos del Pokémon evolucionado
  if (evolution && evolution.min_level && currentPokemon.level >= evolution.min_level) {
    const evolvedName = evolution.species.name.toLowerCase();
    const pokeRes = await fetch(`http://localhost:8000/pokemon/${evolvedName}`);
    const evolvedData = await pokeRes.json();

    if (!evolvedData.stats) {
      return currentPokemon;
    }

    // 4. Calcula los stats actuales
    const actualStats = calculateActualStats(
      evolvedData.stats,
      currentPokemon.level,
      currentPokemon.IVs
    );

    return {
      ...currentPokemon,
      name: evolvedData.name,
      image: evolvedData.image,
      moves: evolvedData.moves,
      baseStats: evolvedData.stats,
      stats: actualStats,
      types: evolvedData.types
    };
  }

  return currentPokemon;
}

function Combat() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialTeam = location.state?.team || [];
  const [team, setTeam] = useState(initialTeam);
  const [randomPokemon, setRandomPokemon] = useState(null);
  const [wildPokemonHP, setWildPokemonHP] = useState(null);
  const [playerPokemonHP, setPlayerPokemonHP] = useState(null);
  const [activePokemonIndex, setActivePokemonIndex] = useState(0);
  const [teamHP, setTeamHP] = useState([]);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [isManualSwitch, setIsManualSwitch] = useState(false);
  const [combatLog, setCombatLog] = useState([]);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [inventory, setInventory] = useState({ pokeball: 0 });
  const [moveLearning, setMoveLearning] = useState(null); // {pokemon, newMove}

  const addToCombatLog = (message) => {
    setCombatLog(prevLog => [...prevLog, message]);
  };

  function replaceMove(pokemon, moveIndex, newMove) {
    const updatedTeam = [...team];
    const poke = { ...pokemon };
    poke.moves = [...poke.moves];
    poke.moves[moveIndex] = {
      move: { name: newMove },
      version_group_details: []
    };
    updatedTeam[team.indexOf(pokemon)] = poke;
    setTeam(updatedTeam);
    setMoveLearning(null);
    addToCombatLog(`${poke.name} aprendió ${newMove}!`);
  }

  async function checkForNewMoves(pokemon) {
    const res = await fetch(`http://localhost:8000/pokemon/${pokemon.name}`);
    const data = await res.json();

    // Movimientos que se aprenden exactamente al nivel actual
    const newMoves = data.moves.filter(
      (move) =>
        move.version_group_details.some(
          (detail) =>
            detail.move_learn_method.name === "level-up" &&
            detail.level_learned_at === pokemon.level
        )
    );

    // Obtén SOLO los 4 movimientos equipados actuales
    const equippedMoves = pokemon.moves.slice(0, 4);
    const currentMoveNames = equippedMoves.map(m =>
      typeof m === "string"
        ? m
        : m.move?.name || m.name || ""
    );

    console.log("Movimientos nuevos posibles:", newMoves.map(m => m.move.name));
    console.log("Movimientos actuales:", currentMoveNames);

    if (newMoves.length > 0) {
      const newMoveName = newMoves[0].move.name;
      if (currentMoveNames.includes(newMoveName)) return;

      if (equippedMoves.length < 4) {
        // Añadir el nuevo movimiento al final de los equipados
        const updatedTeam = [...team];
        const poke = { ...pokemon };
        poke.moves = [...equippedMoves, { move: { name: newMoveName }, version_group_details: [] }];
        // Si el Pokémon tenía más de 4 movimientos, añade los demás después
        if (pokemon.moves.length > 4) {
          poke.moves = [...poke.moves, ...pokemon.moves.slice(4)];
        }
        updatedTeam[team.indexOf(pokemon)] = poke;
        setTeam(updatedTeam);
        addToCombatLog(`${poke.name} aprendió ${newMoveName}!`);
        return;
      }

      // Si tiene 4 movimientos, mostrar el modal para reemplazar
      setMoveLearning({ pokemon, newMove: newMoveName });
    }
  }

  useEffect(() => {
    if (team.length > 0) {
      const level = 5;
      const newTeam = [...team];
      const newTeamHP = [];

      newTeam.forEach(pokemon => {
        const IVs = {
          hp: Math.floor(Math.random() * 32),
          attack: Math.floor(Math.random() * 32),
          defense: Math.floor(Math.random() * 32),
          "special-attack": Math.floor(Math.random() * 32),
          "special-defense": Math.floor(Math.random() * 32),
          speed: Math.floor(Math.random() * 32),
        };
        pokemon.IVs = IVs;
        pokemon.level = level;

        // GUARDA los stats base originales SOLO si no existen
        if (!pokemon.baseStats) {
          // Si el backend te da los stats base en otra propiedad, usa esa
          // Por ejemplo: pokemon.baseStats = { ...pokemon.base_stats };
          pokemon.baseStats = { ...pokemon.stats }; // <-- Aquí deben ser los stats base del backend
        }

        // Calcula los stats reales a partir de los base
        pokemon.stats = calculateActualStats(pokemon.baseStats, level, IVs);

        newTeamHP.push(pokemon.stats.hp);
      });

      setTeamHP(newTeamHP);
    }
  }, []);

  const applyDamageToPlayer = (damage) => {
    setTeamHP(prevHPs => {
      const newHPs = [...prevHPs];
      newHPs[activePokemonIndex] = Math.max(newHPs[activePokemonIndex] - damage, 0);

      if (newHPs[activePokemonIndex] <= 0) {
        const allFainted = newHPs.every(hp => hp <= 0);
        if (newHPs[activePokemonIndex] == 0) {
          setShowTeamSelection(true);
        } else if (allFainted) {
          console.log("Todos los Pokémon del jugador han sido derrotados");
        }
      }

      return newHPs;
    });
  };

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
    if (!randomPokemon) return;

    // console.log(`¡${yourPokemon.name} usó ${moveName} contra ${randomPokemon.name}!`);

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
    if (power != 0) {
      damage = 0.01 * stab * effectiveness * randomNumber *
        ((((0.2 * level + 1) * atk * power) / (25 * def)) + 2);
    }

    console.log(`→ Tipo del ataque: ${type}`);
    console.log(`→ Categoría del ataque: ${atkCat}`);
    console.log(`→ IV Pokemon: ${yourPokemon.IVs}`);
    console.log(`→ Efectividad: x${effectiveness}`);
    console.log(`→ Daño calculado: ${Math.round(damage)}`);

    const roundedDamage = Math.round(damage);
    addToCombatLog(`${yourPokemon.name} usó ${moveName} e infligió ${roundedDamage} de daño a ${randomPokemon.name}.`);

    setWildPokemonHP(prevHP => {
      const newHP = Math.max(prevHP - Math.round(damage), 0);
      if (newHP <= 0) {
        console.log(`${randomPokemon.name} ha sido derrotado!`);

        // Subir de nivel al Pokémon del jugador
        const updatedTeam = [...team];
        let currentPokemon = { ...updatedTeam[activePokemonIndex] };

        const previousLevel = currentPokemon.level;
        const newLevel = previousLevel + 1; //Cambiar

        currentPokemon.level = newLevel;
        currentPokemon.stats = calculateActualStats(
          currentPokemon.baseStats,
          newLevel,
          currentPokemon.IVs
        );

        const newTeamHP = [...teamHP];
        const previousHP = newTeamHP[activePokemonIndex];

        const previousMaxHP = calculateActualStats(
          currentPokemon.baseStats,
          previousLevel,
          currentPokemon.IVs
        ).hp;

        const newMaxHP = currentPokemon.stats.hp;
        const hpIncrement = newMaxHP - previousMaxHP;

        newTeamHP[activePokemonIndex] = Math.min(previousHP + hpIncrement, newMaxHP);

        setPlayerPokemonHP(newTeamHP[activePokemonIndex]);
        setTeamHP(newTeamHP);

        addToCombatLog(`${currentPokemon.name} subió al nivel ${currentPokemon.level}!`);

        // --- EVOLUCIÓN ---
        (async () => {
          const evolvedPokemon = await checkEvolution(currentPokemon);
          updatedTeam[activePokemonIndex] = evolvedPokemon;
          setTeam(updatedTeam);

          if (evolvedPokemon.name !== currentPokemon.name) {
            addToCombatLog(`${currentPokemon.name} evolucionó a ${evolvedPokemon.name}!`);
          }
          // Chequea si aprende un nuevo movimiento
          await checkForNewMoves(updatedTeam[activePokemonIndex]);
        })();

        setShowItemSelection(true);
      }
      return newHP;
    });

    return damage;
  }

  async function wildAttack(playerPokemon) {
    if (!randomPokemon || !playerPokemon) return;

    const moveIndex = Math.floor(Math.random() * 4);
    const move = getMovesBeforeLevel(randomPokemon.moves, 5)[moveIndex];

    if (!move) return;

    const moveRes = await fetch(`http://localhost:8000/move/${move}`);
    const moveData = await moveRes.json();

    const power = moveData.power || 0;
    const type = moveData.type;
    const damageType = moveData.damage_class || "physical";

    const effectiveness = await fetchEffectiveness(type, playerPokemon.types || []);

    const level = randomPokemon.level || 5;
    const atkCat = damageType === 'special' ? 'special-attack' : 'attack';
    const defCat = damageType === 'special' ? 'special-defense' : 'defense';

    const atk = randomPokemon.stats[atkCat];
    const def = playerPokemon.stats[defCat];

    const stab = randomPokemon.types.includes(type) ? 1.5 : 1;
    const randomNumber = Math.floor(Math.random() * (100 - 85 + 1)) + 85;

    let damage = 0;
    if (power !== 0) {
      damage = 0.01 * stab * effectiveness * randomNumber *
        ((((0.2 * level + 1) * atk * power) / (25 * def)) + 2);
    }

    const roundedDamage = Math.round(damage);
    addToCombatLog(`${randomPokemon.name} usó ${move} e infligió ${roundedDamage} de daño a ${playerPokemon.name}.`);

    console.log(`El Pokémon salvaje usó ${move}`);
    console.log(`→ Daño infligido al jugador: ${Math.round(damage)}`);

    applyDamageToPlayer(Math.round(damage));
  }

  async function handleTurn(moveName, playerPokemon) {
    if (!randomPokemon || !playerPokemon || !randomPokemon.stats || !playerPokemon.stats) return;



    const playerSpeed = playerPokemon.stats.speed;
    const wildSpeed = randomPokemon.stats.speed;
    console.log(`Velocidad del jugador: ${playerSpeed}`);
    console.log(`Velocidad del Pokémon salvaje: ${wildSpeed}`);

    if (playerSpeed >= wildSpeed) {
      const damageToWild = await fightWildPokemon(moveName, playerPokemon);

      // Obtenemos el HP actualizado del Pokémon salvaje
      const updatedWildHP = wildPokemonHP - Math.round(damageToWild);
      if (updatedWildHP > 0) {
        await wildAttack(playerPokemon);
      }

    } else {
      // Calcula el daño antes de actualizar el estado
      const moveIndex = Math.floor(Math.random() * 4);
      const move = getMovesBeforeLevel(randomPokemon.moves, 5)[moveIndex];
      if (!move) return;

      const moveRes = await fetch(`http://localhost:8000/move/${move}`);
      const moveData = await moveRes.json();

      const power = moveData.power || 0;
      const type = moveData.type;
      const damageType = moveData.damage_class || "physical";
      const effectiveness = await fetchEffectiveness(type, playerPokemon.types || []);
      const level = randomPokemon.level || 5;
      const atkCat = damageType === 'special' ? 'special-attack' : 'attack';
      const defCat = damageType === 'special-defense' ? 'special-defense' : 'defense';
      const atk = randomPokemon.stats[atkCat];
      const def = playerPokemon.stats[defCat];
      const stab = randomPokemon.types.includes(type) ? 1.5 : 1;
      const randomNumber = Math.floor(Math.random() * (100 - 85 + 1)) + 85;

      let damage = 0;
      if (power !== 0) {
        damage = 0.01 * stab * effectiveness * randomNumber *
          ((((0.2 * level + 1) * atk * power) / (25 * def)) + 2);
      }
      const roundedDamage = Math.round(damage);
      const updatedPlayerHP = Math.max(teamHP[activePokemonIndex] - roundedDamage, 0);

      addToCombatLog(`${randomPokemon.name} usó ${move} e infligió ${roundedDamage} de daño a ${playerPokemon.name}.`);
      applyDamageToPlayer(roundedDamage);

      // Solo ataca si sigue vivo
      if (updatedPlayerHP > 0) {
        await fightWildPokemon(moveName, playerPokemon);
      }
    }
  }
  const movesBeforeLevel5 = randomPokemon ? getMovesBeforeLevel(randomPokemon.moves, 5) : [];

  React.useEffect(() => {
    if (teamHP.length === team.length && teamHP.length > 0) {
      const allFainted = teamHP.every(hp => hp <= 0);
      if (allFainted) {
        setTimeout(() => {
          navigate('/');
        }, 2000); // Espera 2 segundos antes de redirigir
      }
    }
  }, [teamHP, team.length, navigate]);

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: '#3498db',
    color: 'white',
    transition: 'background-color 0.3s',
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#333',
      backgroundColor: '#f5f7fa',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '25px', textAlign: 'center' }}>¡Combate Pokémon!</h2>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {/* Zona de combate: izquierda */}
        <div style={{ flex: 1 }}>
          {!showTeamSelection ? (
            <div style={{
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "12px",
              width: "220px",
              margin: "0 auto 20px auto",
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <img
                src={team[activePokemonIndex].image}
                alt={team[activePokemonIndex].name}
                style={{ width: '100px', marginBottom: '10px' }}
              />
              <p style={{ fontWeight: '700', fontSize: '20px', margin: '5px 0' }}>
                {team[activePokemonIndex].name}
              </p>
              <p style={{ fontWeight: '600', margin: '5px 0', color: '#27ae60' }}>
                HP: {teamHP[activePokemonIndex]} / {team[activePokemonIndex].stats?.hp || '??'}
              </p>

              <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#34495e' }}>
                Nivel: {team[activePokemonIndex].level}
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {getMovesBeforeLevel(team[activePokemonIndex].moves, 5).map(move => (
                  <button
                    key={move}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: '#3498db',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      boxShadow: '0 2px 6px rgba(52, 152, 219, 0.4)',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2980b9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3498db'}
                    onClick={async () => {
                      await handleTurn(move, team[activePokemonIndex]);
                    }}
                  >
                    {move}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowTeamSelection(true)}
                style={{
                  padding: '10px 25px',
                  borderRadius: '25px',
                  border: 'none',
                  backgroundColor: '#e67e22',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 2px 8px rgba(230, 126, 34, 0.5)',
                  transition: 'background-color 0.3s',
                  display: 'block',
                  margin: '0 auto'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d35400'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e67e22'}
              >
                Cambio
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '30px',
            }}>
              {team.map((pokemon, index) => {
                if (index === activePokemonIndex || teamHP[index] <= 0) return null;
                return (
                  <div
                    key={pokemon.name}
                    style={{
                      border: "1px solid #ccc",
                      padding: "10px",
                      borderRadius: "8px",
                      width: "180px",
                      cursor: "pointer",
                      margin: "10px auto"
                    }}
                    onClick={async () => {
                      setActivePokemonIndex(index);
                      setShowTeamSelection(false);

                      if (isManualSwitch) {
                        setIsManualSwitch(false);
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await wildAttack(team[index]);
                      }
                    }}
                  >
                    <img src={pokemon.image} alt={pokemon.name} style={{ width: '80px' }} />
                    <p>{pokemon.name}</p>
                    <p>HP: {teamHP[index]} / {pokemon.stats?.hp || '??'}</p>
                  </div>
                );
              })}

              <button onClick={() => setShowTeamSelection(false)} style={{ marginTop: "20px" }}>
                Volver
              </button>
            </div>
          )}

          {randomPokemon && (
            <div style={{ marginTop: 40 }}>
              <h3 style={{ color: '#c0392b', marginBottom: '15px' }}>Pokémon Aleatorio</h3>
              <div style={{
                border: "1px solid #ccc",
                padding: "15px",
                borderRadius: "12px",
                display: "inline-block",
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(192, 57, 43, 0.2)'
              }}>
                <img src={randomPokemon.image} alt={randomPokemon.name} style={{ width: '120px', marginBottom: '10px' }} />
                <p style={{ fontWeight: '700', fontSize: '22px', margin: '8px 0' }}>{randomPokemon.name}</p>
                <p style={{ marginBottom: '8px', fontSize: '16px', color: '#7f8c8d' }}>
                  Tipos: {randomPokemon.types.join(', ')}
                </p>
                <p style={{ fontWeight: '600', color: '#c0392b', marginBottom: '15px', fontSize: '16px' }}>
                  HP: {wildPokemonHP} / {randomPokemon.stats.hp}
                </p>
                <h4 style={{ marginBottom: '10px', color: '#7f8c8d' }}>Movimientos aprendidos antes del nivel 5:</h4>
                <ul style={{ paddingLeft: 0, listStyle: 'none', marginBottom: 0 }}>
                  {movesBeforeLevel5.length === 0 ? (
                    <li style={{ fontStyle: 'italic', color: '#999' }}>No tiene movimientos a nivel ≤ 5</li>
                  ) : (
                    movesBeforeLevel5.map(move => (
                      <li
                        key={move}
                        style={{
                          margin: '6px 0',
                          padding: '6px 12px',
                          backgroundColor: '#f0f3f5',
                          borderRadius: '15px',
                          display: 'inline-block',
                          cursor: 'default',
                          fontWeight: '600',
                          color: '#34495e',
                          userSelect: 'none'
                        }}
                      >
                        {move}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Historial de combate: derecha */}
        <div style={{
          width: '300px',
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          maxHeight: '600px',
          overflowY: 'auto',
          fontSize: '14px'
        }}>
          <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>Historial del combate:</h4>
          {combatLog.length === 0 ? (
            <p style={{ color: '#999' }}><i>Aún no hay acciones.</i></p>
          ) : (
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {combatLog.map((entry, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{entry}</li>
              ))}
            </ul>
          )}
        </div>
        {showItemSelection && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <h3>¡El Pokémon salvaje fue derrotado!</h3>
              <p>¿Qué quieres hacer?</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
                <button
                  style={buttonStyle}
                  onClick={() => {
                    // Curar al Pokémon actual
                    const newTeamHP = [...teamHP];
                    const maxHP = team[activePokemonIndex].stats.hp;
                    newTeamHP[activePokemonIndex] = maxHP;
                    setTeamHP(newTeamHP);
                    addToCombatLog(`${team[activePokemonIndex].name} ha sido curado al máximo.`);
                    setShowItemSelection(false);
                    generateRandomPokemon();
                  }}
                >
                  🧪 Curar
                </button>
                <button
                  style={buttonStyle}
                  onClick={() => {
                    setInventory(inv => ({ ...inv, pokeball: inv.pokeball + 1 }));
                    addToCombatLog("¡Has recibido una Pokéball!");
                    setShowItemSelection(false);
                    generateRandomPokemon();
                  }}
                >
                  🎯 Pokéball
                </button>
                <button
                  style={buttonStyle}
                  onClick={() => {
                    setShowItemSelection(false);
                    generateRandomPokemon();
                  }}
                >
                  ⚔️ Continuar
                </button>
              </div>
            </div>
          </div>
        )}
        {inventory.pokeball > 0 && randomPokemon && (
          <button
            style={{
              marginTop: '10px',
              padding: '8px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#e74c3c',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 6px rgba(231, 76, 60, 0.4)',
              transition: 'background-color 0.3s',
              display: 'block',
              width: '100%',
            }}
            onClick={async () => {
              if (inventory.pokeball <= 0) return;
              setInventory(inv => ({ ...inv, pokeball: inv.pokeball - 1 }));

              // Lógica de captura simple (puedes mejorarla)
              const success = Math.random() < 0.5; // 50% de probabilidad
              if (success) {
                addToCombatLog(`¡Capturaste a ${randomPokemon.name}!`);
                setShowItemSelection(false);

                // Si el equipo tiene menos de 6, añade el Pokémon capturado
                setTeam(prevTeam => {
                  if (prevTeam.length < 6) {
                    // Asigna IVs y nivel al capturado
                    const IVs = {
                      hp: Math.floor(Math.random() * 32),
                      attack: Math.floor(Math.random() * 32),
                      defense: Math.floor(Math.random() * 32),
                      "special-attack": Math.floor(Math.random() * 32),
                      "special-defense": Math.floor(Math.random() * 32),
                      speed: Math.floor(Math.random() * 32),
                    };
                    const level = 5;
                    const baseStats = randomPokemon.stats;
                    const stats = calculateActualStats(baseStats, level, IVs);
                    const newPokemon = {
                      ...randomPokemon,
                      IVs,
                      level,
                      baseStats,
                      stats,
                    };
                    setTeamHP(hpArr => [...hpArr, stats.hp]);
                    return [...prevTeam, newPokemon];
                  }
                  return prevTeam;
                });

                setRandomPokemon(null);
                setWildPokemonHP(null);

                generateRandomPokemon();
              } else {
                addToCombatLog(`¡${randomPokemon.name} escapó de la Pokéball!`);
                await wildAttack(team[activePokemonIndex]);
              }
            }}
          >
            Lanzar Pokéball ({inventory.pokeball})
          </button>
        )}
        {moveLearning && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <h3>{moveLearning.pokemon.name} quiere aprender {moveLearning.newMove}.</h3>
              <p>¿Quieres reemplazar uno de los movimientos actuales?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                {moveLearning.pokemon.moves.map((moveObj, idx) => (
                  <button
                    key={idx}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: '#3498db',
                      color: 'white',
                      transition: 'background-color 0.3s',
                    }}
                    onClick={() => replaceMove(moveLearning.pokemon, idx, moveLearning.newMove)}
                  >
                    Reemplazar {moveObj.move?.name || moveObj}
                  </button>
                ))}
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    transition: 'background-color 0.3s',
                  }}
                  onClick={() => setMoveLearning(null)}
                >
                  Mantener movimientos actuales
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Combat;