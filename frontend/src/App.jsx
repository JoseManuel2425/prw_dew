import React, { useEffect, useState } from 'react';
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

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 60;
  alert(user);
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
          console.warn("Respuesta inesperada:", data);
          setPokemonList([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al conectar con el backend:", err);
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

  // Si cambian los filtros, vuelve a la página 1
  useEffect(() => {
    setPage(1);
  }, [typeFilter, generationFilter]);

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
        width: 120,
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
          {team.map(pokemon => (
            <div
              key={pokemon.name}
              style={{
                margin: "4px 0",
                background: "#fff3",
                borderRadius: 6,
                padding: 2,
                cursor: "pointer"
              }}
              onClick={() => removeFromTeam(pokemon)}
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
                  <option key={type} value={type}>{type}</option>
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
                  border: "3px solid #555",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: team.length < 6 ? "pointer" : "not-allowed",
                  opacity: team.length >= 6 ? 0.5 : 1,
                  transition: "box-shadow 0.2s",
                  boxShadow: "0 2px 8px #0004"
                }}
                onClick={() => addToTeam(pokemon)}
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