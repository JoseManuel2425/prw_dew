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
  const [playerPokemonHP, setPlayerPokemonHP] = useState(null);
  const [activePokemonIndex, setActivePokemonIndex] = useState(0);
  const [teamHP, setTeamHP] = useState([]);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [isManualSwitch, setIsManualSwitch] = useState(false);
  const [combatLog, setCombatLog] = useState([]);

  const addToCombatLog = (message) => {
    setCombatLog(prevLog => [...prevLog, message]);
  };


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
        pokemon.stats = calculateActualStats(pokemon.stats, level, IVs);
        newTeamHP.push(pokemon.stats.hp);
      });

      setTeamHP(newTeamHP);
    }
  }, [team]);

  const applyDamageToPlayer = (damage) => {
    setTeamHP(prevHPs => {
      const newHPs = [...prevHPs];
      newHPs[activePokemonIndex] = Math.max(newHPs[activePokemonIndex] - damage, 0);

      if (newHPs[activePokemonIndex] <= 0) {
        const allFainted = newHPs.every(hp => hp <= 0);
        if (newHPs[activePokemonIndex] == 0) {
          setShowTeamSelection(true);
        } else if(allFainted) {
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
    if (!randomPokemon) return; // Por seguridad, que haya pokemon salvaje

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
    if(power != 0) {
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
        generateRandomPokemon();
      }
      return newHP;
    });

    return damage;
  }

  async function wildAttack(playerPokemon) {
    if (!randomPokemon || !playerPokemon) return;

    const move = getMovesBeforeLevel(randomPokemon.moves, 5)[0]; // usa el primer movimiento disponible
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
      await wildAttack(playerPokemon);

      // Comprobamos si el Pokémon del jugador sigue vivo después del ataque
      const updatedPlayerHP = teamHP[activePokemonIndex];
      if (updatedPlayerHP > 0) {
        await fightWildPokemon(moveName, playerPokemon);
      }
    }

    if (teamHP[activePokemonIndex] <= 0) {
      console.log("Tu Pokémon actual está debilitado. Debes elegir otro.");
      return;
    }

    if (teamHP[activePokemonIndex] <= 0) {
      addToCombatLog(`${playerPokemon.name} ha sido derrotado. Elige otro Pokémon.`);
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
                Movimientos aprendidos antes del nivel 5:
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
      </div>
    </div>
  );
}

export default Combat;
