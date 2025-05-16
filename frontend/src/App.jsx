import React, { useEffect, useState, useCallback } from 'react';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [showRegister, setShowRegister] = useState(false);

  // Filtros
  const [typeFilter, setTypeFilter] = useState("");
  const [generationFilter, setGenerationFilter] = useState("");

  // Traduccion de tipos
  const TYPE_TRANSLATIONS = {
    normal: "Normal",
    fire: "Fuego",
    water: "Agua",
    electric: "Eléctrico",
    grass: "Planta",
    ice: "Hielo",
    fighting: "Lucha",
    poison: "Veneno",
    ground: "Tierra",
    flying: "Volador",
    psychic: "Psíquico",
    bug: "Bicho",
    rock: "Roca",
    ghost: "Fantasma",
    dragon: "Dragón",
    dark: "Siniestro",
    steel: "Acero",
    fairy: "Hada"
  };

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 60;

  // Selector de cuadrícula y equipo
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusArea, setFocusArea] = useState("grid"); // "grid" o "team"
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("http://localhost:8000/")
      .then(res => res.json())
      .then(data => {
        if (data?.pokemons) {
          setPokemonList(data.pokemons);
        } else {
          setPokemonList([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setPokemonList([]);
        setLoading(false);
      });
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const allTypes = Array.from(new Set(pokemonList.flatMap(p => p.types || [])));
  const allGenerations = Array.from(new Set(pokemonList.map(p => p.generation))).sort();

  const addToTeam = (pokemon) => {
    if (team.length < 6 && !team.some(p => p.name === pokemon.name)) {
      setTeam([...team, pokemon]);
    }
  };

  const removeFromTeam = (pokemon) => {
    setTeam(team.filter(p => p.name !== pokemon.name));
  };

  // Filtros y paginación
  const filteredPokemons = pokemonList.filter(
    p =>
      !team.some(tp => tp.name === p.name) &&
      (typeFilter === "" || (p.types && p.types.includes(typeFilter))) &&
      (generationFilter === "" || p.generation === generationFilter)
  );

  const totalPages = Math.ceil(filteredPokemons.length / pageSize);
  const paginatedPokemons = filteredPokemons.slice((page - 1) * pageSize, page * pageSize);

  // Si cambian los filtros, resetea selector y página
  useEffect(() => {
    setSelectedIndex(0);
    setPage(1);
    setFocusArea("grid");
  }, [typeFilter, generationFilter]);

  // Si cambia la página, resetea el selector de cuadrícula
  useEffect(() => {
    setSelectedIndex(0);
    setFocusArea("grid");
  }, [page]);

  // Si cambia el equipo y el índice seleccionado es inválido, ajústalo
  useEffect(() => {
    if (selectedTeamIndex >= team.length && team.length > 0) {
      setSelectedTeamIndex(team.length - 1);
    }
  }, [team, selectedTeamIndex]);

  // Manejo de teclado para mover el selector y alternar entre grid/equipo
  const handleKeyDown = useCallback(
  (e) => {
    if (!user) return;

    // Cambiar foco con Tab
    if (e.key === "Tab") {
      e.preventDefault();
      if (focusArea === "grid" && team.length > 0) {
        setFocusArea("team");
        setSelectedTeamIndex(0);
      } else {
        setFocusArea("grid");
      }
      return;
    }

    // --- Selector en cuadrícula principal ---
    if (focusArea === "grid" && paginatedPokemons.length > 0) {
      const cols = 10;
      const rows = Math.ceil(pageSize / cols);
      let row = Math.floor(selectedIndex / cols);
      let col = selectedIndex % cols;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          if (col < cols - 1 && selectedIndex + 1 < paginatedPokemons.length) setSelectedIndex(selectedIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (col > 0) setSelectedIndex(selectedIndex - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (row < rows - 1 && selectedIndex + cols < paginatedPokemons.length) setSelectedIndex(selectedIndex + cols);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (row > 0) setSelectedIndex(selectedIndex - cols);
          break;
        case "Enter":
          const selected = paginatedPokemons[selectedIndex];
          if (selected) addToTeam(selected);
          break;
        default:
          break;
      }
    }

    // --- Selector en equipo ---
    if (focusArea === "team" && team.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (selectedTeamIndex < team.length - 1) setSelectedTeamIndex(selectedTeamIndex + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (selectedTeamIndex > 0) setSelectedTeamIndex(selectedTeamIndex - 1);
          break;
        case "Enter":
          removeFromTeam(team[selectedTeamIndex]);
          break;
        default:
          break;
      }
    }
  },
  [selectedIndex, paginatedPokemons, user, focusArea, team, selectedTeamIndex]
);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const selectedPokemon = paginatedPokemons[selectedIndex];

  const LoadingScreen = () => (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#222",
      zIndex: 9999
    }}>
      <h1 style={{ fontFamily: "monospace", fontSize: "2.5rem", marginBottom: "24px", color: "#ffcb05" }}>Pokédex</h1>
      <div style={{
        width: "220px",
        height: "18px",
        background: "#eee",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 2px 8px #0002"
      }}>
        <div className="loading-bar" style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, #ffcb05 40%, #3b4cca 100%)",
          animation: "loadingBar 1.2s linear infinite"
        }} />
      </div>
      <style>
        {`
          @keyframes loadingBar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .loading-bar {
            transform: translateX(-100%);
            animation: loadingBar 1.2s linear infinite;
          }
        `}
      </style>
    </div>
  );

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 60 }}>
        {!showRegister ? (
          <>
            <Login onLogin={handleLogin} />
            <div style={{ margin: 16 }}>
              ¿No tienes cuenta?{" "}
              <button onClick={() => setShowRegister(true)}>Regístrate</button>
            </div>
          </>
        ) : (
          <>
            <Register onRegister={() => setShowRegister(false)} />
            <div style={{ margin: 16 }}>
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => setShowRegister(false)}>Inicia sesión</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- DISEÑO PRINCIPAL ---
  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#222",
      fontFamily: "monospace"
    }}>
      {/* Panel Izquierdo */}
      <div style={{
        width: 220,
        background: "#b71c1c",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 0",
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        boxShadow: "2px 0 8px #0008"
      }}>
        <div style={{
          fontWeight: "bold",
          fontSize: 22,
          marginBottom: 24,
          letterSpacing: 2
        }}>Pokédex</div>
        <div style={{
          background: "#fff2",
          borderRadius: 8,
          padding: "8px 0",
          width: "80%",
          marginBottom: 24,
          textAlign: "center"
        }}>
          <div style={{ marginBottom: 8 }}>Equipo</div>
          {team.map((pokemon, idx) => (
            <div
              key={pokemon.name}
              style={{
                margin: "4px 0",
                background: focusArea === "team" && selectedTeamIndex === idx ? "#ffcb05" : "#fff3",
                borderRadius: 6,
                padding: 2,
                cursor: "pointer",
                color: focusArea === "team" && selectedTeamIndex === idx ? "#222" : undefined,
                fontWeight: focusArea === "team" && selectedTeamIndex === idx ? "bold" : undefined,
                outline: focusArea === "team" && selectedTeamIndex === idx ? "2px solid #ffcb05" : "none"
              }}
              onClick={() => removeFromTeam(pokemon)}
              onMouseEnter={() => {
                setFocusArea("team");
                setSelectedTeamIndex(idx);
              }}
              title="Quitar del equipo"
            >
              <img src={pokemon.image} alt={pokemon.name} style={{ width: 32, display: "block", margin: "0 auto" }} />
              <div style={{ fontSize: "0.8rem" }}>{pokemon.name}</div>
            </div>
          ))}
          {team.length === 0 && (
            <div style={{ color: "#fff8", fontSize: "0.9rem" }}>Vacío</div>
          )}
        </div>
        {/* Detalle del Pokémon seleccionado */}
        {selectedPokemon && (
          <div style={{
            background: "#fff2",
            borderRadius: 8,
            padding: "12px 0",
            width: "80%",
            marginBottom: 24,
            textAlign: "center",
            boxShadow: "0 2px 8px #0003"
          }}>
            <div style={{ fontWeight: "bold", color: "#222", marginBottom: 4 }}>
              #{selectedPokemon.id || (pokemonList.findIndex(p => p.name === selectedPokemon.name) + 1)}
            </div>
            <img src={selectedPokemon.image} alt={selectedPokemon.name} style={{ width: 48, marginBottom: 4 }} />
            <div style={{ color: "#222", fontSize: "1rem" }}>{selectedPokemon.name}</div>
          </div>
        )}
        <button
          onClick={() => {
            setUser(null);
            setTeam([]);
            localStorage.removeItem("user");
          }}
          style={{
            marginTop: "auto",
            background: "#fff2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Panel Central */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 0"
      }}>
        <div style={{
          background: "#444",
          borderRadius: 24,
          boxShadow: "0 4px 24px #0008",
          padding: 36,
          minWidth: 1200,
          minHeight: 800
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <span style={{ color: "#ffcb05", fontWeight: "bold", fontSize: 32 }}>Pokédex</span>
              <span style={{ color: "#fff", marginLeft: 24, fontSize: 20 }}>Hola, {user}</span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ borderRadius: 12, padding: 8, fontSize: 16 }}>
                <option value="">Todos los tipos</option>
                {allTypes.map(type => (
                  <option key={type} value={type}>
                    {TYPE_TRANSLATIONS[type] || type}
                  </option>
                ))}
              </select>
              <select value={generationFilter} onChange={e => setGenerationFilter(e.target.value)} style={{ borderRadius: 12, padding: 8, fontSize: 16 }}>
                <option value="">Todas las generaciones</option>
                {allGenerations.map(gen => (
                  <option key={gen} value={gen}>{gen.replace('generation-', 'Gen ')}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Cuadrícula de Pokémon */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 90px)",
            gridGap: "18px",
            background: "#888",
            borderRadius: 18,
            padding: 24,
            justifyContent: "center"
          }}>
            {paginatedPokemons.map((pokemon, idx) => (
              <div
                key={pokemon.name}
                style={{
                  width: 90,
                  height: 90,
                  background: "#222",
                  border: focusArea === "grid" && selectedIndex === idx ? "3px solid #ffcb05" : "3px solid #555",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: team.length < 6 ? "pointer" : "not-allowed",
                  opacity: team.length >= 6 ? 0.5 : 1,
                  transition: "box-shadow 0.2s, border 0.2s",
                  boxShadow: focusArea === "grid" && selectedIndex === idx ? "0 0 16px #ffcb0588" : "0 2px 8px #0004"
                }}
                onClick={() => addToTeam(pokemon)}
                onMouseEnter={() => {
                  setFocusArea("grid");
                  setSelectedIndex(idx);
                }}
                title={team.length < 6 ? "Añadir al equipo" : "Equipo lleno"}
              >
                <img src={pokemon.image} alt={pokemon.name} style={{ width: 48, filter: "drop-shadow(0 0 2px #0008)" }} />
              </div>
            ))}
          </div>
          {/* Paginación */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24, gap: 16 }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: "#ffcb05",
                color: "#222",
                fontWeight: "bold",
                fontSize: 18,
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1
              }}
            >Anterior</button>
            <span style={{ color: "#fff", fontSize: 18, alignSelf: "center" }}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background: "#ffcb05",
                color: "#222",
                fontWeight: "bold",
                fontSize: 18,
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.5 : 1
              }}
            >Siguiente</button>
          </div>
        </div>
      </div>
      {/* Panel Derecho (opcional) */}
      <div style={{ width: 60 }}></div>
    </div>
  );
}

export default App;