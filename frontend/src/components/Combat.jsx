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
      baseStats: JSON.parse(JSON.stringify(evolvedData.stats)), // <-- SIEMPRE base stats del backend
      stats: actualStats,
      types: evolvedData.types
    };
  }
  return currentPokemon;
}

function Combat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [turn, setTurn] = useState(1);

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
  const [infoPokemon, setInfoPokemon] = useState(null);

  const addToCombatLog = (message) => {
    setCombatLog(prevLog => [...prevLog, message]);
  };

  function replaceMove(pokemon, moveIndex, newMove) {
    const updatedTeam = [...team];
    const poke = { ...pokemon };
    poke.equippedMoves = [...poke.equippedMoves];
    poke.equippedMoves[moveIndex] = { move: { name: newMove }, version_group_details: [] };
    updatedTeam[team.indexOf(pokemon)] = poke;
    setTeam(updatedTeam);
    setMoveLearning(null);
    addToCombatLog(
      `<span style="color:green;font-weight:bold">${poke.name}</span> aprendió <span style="color:blue;font-weight:bold">${newMove}</span>!`
    );
  }

  async function checkForNewMoves(pokemon) {
    const res = await fetch(`http://localhost:8000/pokemon/${pokemon.name}`);
    const data = await res.json();
    const newMoves = data.moves.filter(
      (move) =>
        move.version_group_details.some(
          (detail) =>
            detail.move_learn_method.name === "level-up" &&
            detail.level_learned_at === pokemon.level
        )
    );
    const equippedMoves = pokemon.equippedMoves;
    const currentMoveNames = equippedMoves.map(m => m.move?.name || m.name || "");
    if (newMoves.length > 0) {
      const newMoveName = newMoves[0].move.name;
      if (currentMoveNames.includes(newMoveName)) return;
      if (equippedMoves.length < 4) {
        const updatedTeam = [...team];
        const poke = { ...pokemon };
        poke.equippedMoves = [...equippedMoves, { move: { name: newMoveName }, version_group_details: [] }];
        updatedTeam[team.indexOf(pokemon)] = poke;
        setTeam(updatedTeam);
        addToCombatLog(`${poke.name} aprendió ${newMoveName}!`);
        return;
      }
      setMoveLearning({ pokemon, newMove: newMoveName });
    }
  }

  useEffect(() => {
    if (team.length > 0) {
      const level = 5;
      const newTeam = team.map(pokemon => {
        // Solo asigna IVs si no existen
        if (!pokemon.IVs) {
          pokemon.IVs = {
            hp: Math.floor(Math.random() * 32),
            attack: Math.floor(Math.random() * 32),
            defense: Math.floor(Math.random() * 32),
            "special-attack": Math.floor(Math.random() * 32),
            "special-defense": Math.floor(Math.random() * 32),
            speed: Math.floor(Math.random() * 32),
          };
        }
        // Guarda una copia inmutable de los base stats originales solo si no existen
        if (!pokemon.baseStats) {
          pokemon.baseStats = JSON.parse(JSON.stringify(pokemon.stats));
        }
        // Inicializa nivel si no existe
        if (!pokemon.level) pokemon.level = level;

        // Calcula los stats reales a partir de los base
        pokemon.stats = calculateActualStats(pokemon.baseStats, pokemon.level, pokemon.IVs);

        // Inicializa movimientos equipados si no existen
        if (!pokemon.equippedMoves) {
          pokemon.equippedMoves = getMovesBeforeLevel(pokemon.moves, 5).map(name => ({
            move: { name },
            version_group_details: []
          }));
        }
        return pokemon;
      });

      setTeam(newTeam);
      setTeamHP(newTeam.map(p => p.stats.hp));
    }
  }, []);

  const applyDamageToPlayer = (damage) => {
    setTeamHP(prevHPs => {
      const newHPs = [...prevHPs];
      newHPs[activePokemonIndex] = Math.max(newHPs[activePokemonIndex] - damage, 0);

      if (newHPs[activePokemonIndex] <= 0) {
        // Elimina el Pokémon desmayado del equipo y de los arrays relacionados
        setTeam(prevTeam => {
          const updatedTeam = prevTeam.filter((_, idx) => idx !== activePokemonIndex);
          // Ajusta el índice activo si es necesario
          setActivePokemonIndex(idx => Math.max(0, idx - (idx === prevTeam.length - 1 ? 1 : 0)));
          return updatedTeam;
        });
        setTeamHP(prev => prev.filter((_, idx) => idx !== activePokemonIndex));
        // Si el equipo queda vacío, no mostrar selección
        setShowTeamSelection(false);
      } else if (newHPs.every(hp => hp <= 0)) {
        console.log("Todos los Pokémon del jugador han sido derrotados");
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
            stats: realStats,
            // Solo los primeros 4 movimientos aprendidos antes del nivel 5 como ataques equipados
            equippedMoves: getMovesBeforeLevel(pokemon.moves, 5).map(name => ({ move: { name }, version_group_details: [] }))
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
    addToCombatLog(
      `<span style="color:green;font-weight:bold">${yourPokemon.name}</span> usó <span style="color:blue;font-weight:bold">${moveName}</span> e infligió <span style="color:red;font-weight:bold">${roundedDamage}</span> de daño a <span style="color:orange;font-weight:bold">${randomPokemon.name}</span>.`
    );

    setWildPokemonHP(prevHP => {
      const newHP = Math.max(prevHP - Math.round(damage), 0);
      if (newHP <= 0) {
        handlePlayerDefeatWild();
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
    addToCombatLog(
      `<span style="color:orange;font-weight:bold">${randomPokemon.name}</span> usó <span style="color:blue;font-weight:bold">${move}</span> e infligió <span style="color:red;font-weight:bold">${roundedDamage}</span> de daño a <span style="color:green;font-weight:bold">${playerPokemon.name}</span>.`
    );

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
      const updatedPlayerHP = Math.max(teamHP[activePokemonIndex] - roundedDamage, 0);

      addToCombatLog(
        `<span style="color:orange;font-weight:bold">${randomPokemon.name}</span> usó <span style="color:blue;font-weight:bold">${move}</span> e infligió <span style="color:red;font-weight:bold">${roundedDamage}</span> de daño a <span style="color:green;font-weight:bold">${playerPokemon.name}</span>.`
      );
      applyDamageToPlayer(roundedDamage);

      // Solo ataca si sigue vivo
      if (updatedPlayerHP > 0) {
        await fightWildPokemon(moveName, playerPokemon);
      }
    }

    // Ahora, después de todas las acciones, agrega el mensaje de turno:
    addToCombatLog(
      `<div style="font-weight:bold;font-size:1.1em;margin:8px 0 4px 0;">Turno ${turn}</div>`
    );
    setTurn(prev => prev + 1);
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

  // Maneja el proceso de subir de nivel, evolución y aprendizaje de movimientos tras derrotar al Pokémon salvaje
  async function handlePlayerDefeatWild() {
    const updatedTeam = [...team];
    let currentPokemon = { ...updatedTeam[activePokemonIndex] };
    const previousLevel = currentPokemon.level;
    const prevMaxHP = currentPokemon.stats.hp;
    const prevCurrentHP = teamHP[activePokemonIndex];

    // Subir de nivel
    const newLevel = previousLevel + 1;
    currentPokemon.level = newLevel;
    // Recalcula stats reales usando baseStats, IVs y nuevo nivel
    currentPokemon.stats = calculateActualStats(
      currentPokemon.baseStats,
      newLevel,
      currentPokemon.IVs
    );

    console.log("IVs de tu Pokémon:", currentPokemon.IVs); // <-- Aquí

    if (!currentPokemon.equippedMoves) {
      currentPokemon.equippedMoves = [];
    }

    // Si el HP estaba al máximo antes de subir de nivel, actualiza el HP actual al nuevo máximo
    setTeamHP(prevHPs => {
      const newHPs = [...prevHPs];
      if (prevCurrentHP === prevMaxHP) {
        newHPs[activePokemonIndex] = currentPokemon.stats.hp;
      }
      return newHPs;
    });

    addToCombatLog(
      `<span style="color:green;font-weight:bold">${currentPokemon.name}</span> subió al nivel <span style="color:purple;font-weight:bold">${currentPokemon.level}</span>!`
    );

    // --- EVOLUCIÓN ---
    let evolvedPokemon = await checkEvolution(currentPokemon);
    // Si evolucionó, actualiza baseStats y recalcula stats reales
    if (evolvedPokemon.name !== currentPokemon.name) {
      evolvedPokemon.equippedMoves = currentPokemon.equippedMoves;
      evolvedPokemon.IVs = currentPokemon.IVs;
      evolvedPokemon.level = currentPokemon.level;
      evolvedPokemon.baseStats = evolvedPokemon.baseStats || evolvedPokemon.stats; // asegúrate de tener baseStats
      evolvedPokemon.stats = calculateActualStats(
        evolvedPokemon.baseStats,
        evolvedPokemon.level,
        evolvedPokemon.IVs
      );
      addToCombatLog(
        `<span style="color:green;font-weight:bold">${currentPokemon.name}</span> evolucionó a <span style="color:orange;font-weight:bold">${evolvedPokemon.name}</span>!`
      );
    }
    updatedTeam[activePokemonIndex] = evolvedPokemon;

    // Chequea si aprende un nuevo movimiento
    const res = await fetch(`http://localhost:8000/pokemon/${evolvedPokemon.name}`);
    const data = await res.json();
    const newMoves = data.moves.filter(
      (move) =>
        move.version_group_details.some(
          (detail) =>
            detail.move_learn_method.name === "level-up" &&
            detail.level_learned_at === evolvedPokemon.level
        )
    );
    const equippedMoves = evolvedPokemon.equippedMoves;
    const currentMoveNames = equippedMoves.map(m => m.move?.name || m.name || "");
    if (newMoves.length > 0) {
      const newMoveName = newMoves[0].move.name;
      if (!currentMoveNames.includes(newMoveName)) {
        if (equippedMoves.length < 4) {
          evolvedPokemon.equippedMoves = [...equippedMoves, { move: { name: newMoveName }, version_group_details: [] }];
          addToCombatLog(
            `<span style="color:green;font-weight:bold">${evolvedPokemon.name}</span> aprendió <span style="color:blue;font-weight:bold">${newMoveName}</span>!`
          );
        } else {
          // Mostrar modal para reemplazo
          setMoveLearning({ pokemon: evolvedPokemon, newMove: newMoveName });
        }
      }
    }
    updatedTeam[activePokemonIndex] = evolvedPokemon;
    setTeam(updatedTeam);
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#222',
      backgroundColor: '#2a2a2a',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      position: 'relative',
      minHeight: '700px' // Asegura espacio para el log completo
    }}>
      <h2 style={{
        color: '#ffcb05',
        marginBottom: '25px',
        textAlign: 'center',
        letterSpacing: 1.5,
        textShadow: '1px 2px 8px #000'
      }}>¡Combate Pokémon!</h2>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        {/* Historial de combate */}
        <div style={{
          width: '300px',
          backgroundColor: '#ededed',
          color: '#222',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          maxHeight: '600px',
          minHeight: '600px',
          overflowY: 'auto',
          fontSize: '14px'
        }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: '1.2em',
            color: '#2c3e50',
            marginBottom: '10px',
            textAlign: 'left'
          }}>
            Turno actual: {turn}
          </div>
          <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>Historial del combate:</h4>
          {combatLog.length === 0 ? (
            <p style={{ color: '#999' }}><i>Aún no hay acciones.</i></p>
          ) : (
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {combatLog.slice().reverse().map((entry, i) => (
                <li key={i} style={{ marginBottom: '6px', listStyle: 'none' }}
                  dangerouslySetInnerHTML={{ __html: entry }} />
              ))}
            </ul>
          )}
        </div>
        {/* Tu Pokémon */}
        {!showTeamSelection ? (
          <div style={{
            border: "2px solid #b71c1c",
            padding: "15px",
            borderRadius: "12px",
            width: "260px", // <-- Igual que el rival
            minHeight: "420px", // <-- Igual que el rival
            backgroundColor: '#ededed',
            color: '#222',
            boxShadow: '0 2px 8px rgba(183,28,28,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}>
            <img
              src={team[activePokemonIndex].image}
              alt={team[activePokemonIndex].name}
              style={{ width: '120px', marginBottom: '10px' }}
            />
            <p style={{ fontWeight: '700', fontSize: '22px', margin: '8px 0' }}>
              {team[activePokemonIndex].name}
            </p>
            <p style={{ fontWeight: '600', margin: '5px 0', color: '#27ae60', fontSize: '16px' }}>
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
              {team[activePokemonIndex] && Array.isArray(team[activePokemonIndex].equippedMoves) && team[activePokemonIndex].equippedMoves.length > 0 ? (
                team[activePokemonIndex].equippedMoves.map((moveObj, idx) => (
                  <button
                    key={moveObj.move?.name || moveObj.name || idx}
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
                      await handleTurn(moveObj.move?.name || moveObj.name, team[activePokemonIndex]);
                    }}
                  >
                    {moveObj.move?.name || moveObj.name}
                  </button>
                ))
              ) : (
                <span style={{color:'#999'}}>No hay movimientos equipados.</span>
              )}
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
            backgroundColor: '#ededed', // Gris claro para tarjeta
            borderRadius: 12,
            padding: 16
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
        {/* Pokémon Rival */}
        {randomPokemon && (
          <div style={{
            border: "2px solid #b71c1c",
            padding: "15px",
            borderRadius: "12px",
            width: "260px", // <-- Igual que el propio
            minHeight: "420px", // <-- Igual que el propio
            backgroundColor: '#ededed',
            color: '#222',
            boxShadow: '0 2px 10px rgba(183,28,28,0.12)',
            position: "relative",
            marginLeft: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}>
            <img src={randomPokemon.image} alt={randomPokemon.name} style={{ width: '120px', marginBottom: '10px' }} />
            <p style={{ fontWeight: '700', fontSize: '22px', margin: '8px 0' }}>{randomPokemon.name}</p>
            <p style={{ marginBottom: '8px', fontSize: '16px', color: '#7f8c8d' }}>
              Tipos: {randomPokemon.types.join(', ')}
            </p>
            <p style={{ fontWeight: '600', color: '#c0392b', marginBottom: '15px', fontSize: '16px' }}>
              HP: {wildPokemonHP} / {randomPokemon.stats.hp}
            </p>
            {/* NO mostrar movimientos del rival */}
            <button
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 20,
                height: 20,
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: 13,
                lineHeight: "20px",
                padding: 0
              }}
              title="Ver información del Pokémon salvaje"
              onClick={() => setInfoPokemon(randomPokemon)}
            >i</button>
          </div>
        )}
      </div>
      {/* Modal de selección de equipo */}
      {showTeamSelection && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#ededed', // Gris claro para tarjeta/modal
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: '90%',
            width: '400px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Selecciona un Pokémon</h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '10px',
              paddingLeft: '10px',
              marginBottom: '15px'
            }}>
              {team.map((pokemon, index) => (
                <div
                  key={pokemon.name}
                  style={{
                    backgroundColor: teamHP[index] > 0 ? '#fff' : '#f8d7da',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: `2px solid ${index === activePokemonIndex ? '#007bff' : '#ccc'}`,
                    boxShadow: index === activePokemonIndex ? '0 4px 8px rgba(0,123,255,0.2)' : 'none',
                    cursor: teamHP[index] > 0 ? 'pointer' : 'not-allowed',
                    opacity: teamHP[index] > 0 ? 1 : 0.6,
                    transition: 'border-color 0.3s, box-shadow 0.3s'
                  }}
                  onClick={() => {
                    if (teamHP[index] > 0) {
                      setActivePokemonIndex(index);
                      setIsManualSwitch(true);
                      addToCombatLog(
                        `<span style="color:green;font-weight:bold">${pokemon.name}</span> fue elegido para combatir.`
                      );
                      setTimeout(() => {
                        setShowTeamSelection(false);
                      }, 500);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={pokemon.image} alt={pokemon.name} style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{pokemon.name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        HP: {teamHP[index]} / {pokemon.stats?.hp || '??'}
                      </div>
                    </div>
                  </div>
                  {teamHP[index] <= 0 && (
                    <span style={{ fontSize: '14px', color: '#c0392b', fontWeight: 'bold' }}>Faint</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTeamSelection(false)}
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
                width: '100%',
                maxWidth: '180px',
                margin: '0 auto'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2980b9'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3498db'}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {randomPokemon && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 200,
          }}
        >
          <button
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: inventory.pokeball > 0 ? '#e74c3c' : '#ccc',
              color: 'white',
              cursor: inventory.pokeball > 0 ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '13px',
              boxShadow: inventory.pokeball > 0 ? '0 2px 6px rgba(231, 76, 60, 0.4)' : 'none',
              transition: 'background-color 0.3s',
              width: '110px',
              opacity: inventory.pokeball > 0 ? 1 : 0.6,
            }}
            disabled={inventory.pokeball <= 0}
            onClick={async () => {
              if (inventory.pokeball <= 0) return;
              setInventory(inv => ({ ...inv, pokeball: inv.pokeball - 1 }));

              // Lógica de captura simple (puedes mejorarla)
              const success = Math.random() < 0.5; // 50% de probabilidad
              if (success) {
                addToCombatLog(
                  `¡Capturaste a <span style="color:orange;font-weight:bold">${randomPokemon.name}</span>!`
                );
                setShowItemSelection(false);

                setTeam(prevTeam => {
                  if (prevTeam.length < 6) {
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
                addToCombatLog(
                  `¡<span style="color:orange;font-weight:bold">${randomPokemon.name}</span> escapó de la Pokéball!`
                );
                await wildAttack(team[activePokemonIndex]);
              }

              // Mensaje de turno y aumento del contador
              addToCombatLog(
                `<div style="font-weight:bold;font-size:1.1em;margin:8px 0 4px 0;">Turno ${turn}</div>`
              );
              setTurn(prev => prev + 1);
            }}
          >
            🎯 Pokéball ({inventory.pokeball})
          </button>
        </div>
      )}
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
            backgroundColor: '#ededed', // Gris claro para tarjeta/modal
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
                  addToCombatLog(
                    `<span style="color:green;font-weight:bold">${team[activePokemonIndex].name}</span> ha sido curado al máximo.`
                  );
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
                  addToCombatLog(
                    `¡Has recibido una <span style="color:#b71c1c;font-weight:bold">Pokéball</span>!`
                  );
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
      {/* Modal de reemplazo de movimientos */}
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
            backgroundColor: '#ededed', // Gris claro para tarjeta/modal
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <h3>{moveLearning.pokemon.name} quiere aprender {moveLearning.newMove}.</h3>
            <p>¿Quieres reemplazar uno de los movimientos actuales?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {(() => {
                // Busca el Pokémon en el equipo por nombre
                let poke = team.find(p => p.name === moveLearning.pokemon.name);
                let moves = poke?.equippedMoves || moveLearning.pokemon.equippedMoves || [];
                if (!moves || moves.length === 0) {
                  return <span style={{color:'#999'}}>No hay movimientos equipados.</span>;
                }
                return moves.map((moveObj, idx) => (
                  <button
                    key={moveObj.move?.name || moveObj.name || idx}
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
                    onClick={() => replaceMove(poke || moveLearning.pokemon, idx, moveLearning.newMove)}
                    disabled={moveObj.move?.name === moveLearning.newMove || moveObj.name === moveLearning.newMove}
                  >
                    Reemplazar {moveObj.move?.name || moveObj.name}
                  </button>
                ));
              })()}
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
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          background: '#ededed', // Gris claro para tarjeta
          borderRadius: 16,
          boxShadow: '0 4px 24px #0004',
          padding: '16px 20px',
          zIndex: 100,
          minWidth: 220,
          maxWidth: 900,
          color: '#222'
        }}
      >
        <div style={{ fontWeight: "bold", color: "#222", marginBottom: 8, fontSize: 16 }}>
          Equipo
        </div>
        <div style={{
          display: "flex",
          flexWrap: "nowrap", // Fuerza una sola fila
          gap: 12,
          justifyContent: "flex-start",
          alignItems: "center",
          overflowX: "auto", // Permite scroll horizontal si hay muchos
          minHeight: 80
        }}>
          {team.map((pokemon, idx) => (
            <div
              key={pokemon.name}
              style={{
                opacity: teamHP[idx] > 0 ? 1 : 0.4,
                filter: teamHP[idx] > 0 ? "none" : "grayscale(0.7)",
                background: "#f5f7fa",
                borderRadius: 8,
                padding: 6,
                width: 60,
                textAlign: "center",
                border: idx === activePokemonIndex ? "2px solid #ffcb05" : "2px solid #eee",
                boxShadow: idx === activePokemonIndex ? "0 0 8px #ffcb05" : "0 2px 8px #0002",
                position: "relative"
              }}
            >
              <img
                src={pokemon.image}
                alt={pokemon.name}
                style={{
                  width: 36,
                  height: 36,
                  objectFit: "contain",
                  marginBottom: 2,
                  filter: teamHP[idx] > 0 ? "none" : "grayscale(0.7)"
                }}
              />
              <div style={{
                fontWeight: "bold",
                fontSize: 13,
                color: "#222"
              }}>{pokemon.name}</div>
              <div style={{
                fontSize: 12,
                color: teamHP[idx] > 0 ? "#27ae60" : "#c0392b"
              }}>
                {teamHP[idx]} / {pokemon.stats?.hp || "??"}
              </div>
              <button
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: "20px",
                  padding: 0
                }}
                title="Ver información"
                onClick={() => setInfoPokemon(pokemon)}
              >i</button>
            </div>
          ))}
        </div>
      </div>
      {infoPokemon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000,
        }}>
          <div style={{
            backgroundColor: '#ededed', // Gris claro para tarjeta/modal
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            minWidth: 320
          }}>
            <h3 style={{marginBottom: 10}}>{infoPokemon.name}</h3>
            <img src={infoPokemon.image} alt={infoPokemon.name} style={{width: 80, marginBottom: 10}} />
            <div style={{marginBottom: 10}}>
              <b>Nivel:</b> {infoPokemon.level}
            </div>
            <div style={{marginBottom: 10}}>
              <b>IVs:</b>
              <pre style={{
                background: "#f5f5f5",
                borderRadius: 8,
                padding: 8,
                textAlign: "left",
                fontSize: 13,
                margin: "6px 0"
              }}>{JSON.stringify(infoPokemon.IVs, null, 2)}</pre>
            </div>
            <div style={{marginBottom: 10}}>
              <b>Stats reales:</b>
              <pre style={{
                background: "#f5f5f5",
                borderRadius: 8,
                padding: 8,
                textAlign: "left",
                fontSize: 13,
                margin: "6px 0"
              }}>{JSON.stringify(infoPokemon.stats, null, 2)}</pre>
            </div>
            <button
              style={{
                marginTop: 10,
                padding: "8px 24px",
                borderRadius: 8,
                border: "none",
                background: "#e74c3c",
                color: "white",
                fontWeight: "bold",
                fontSize: 15,
                cursor: "pointer"
              }}
              onClick={() => setInfoPokemon(null)}
            >Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Combat;