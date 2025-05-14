import React, { useEffect, useState } from 'react';
import Register from './Register';
import Login from './Login';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Filtros
  const [typeFilter, setTypeFilter] = useState("");
  const [generationFilter, setGenerationFilter] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then(res => res.json())
      .then(data => {
        setPokemonList(data.pokemons);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al conectar con el backend:", err);
        setLoading(false);
      });
    /* if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("http://localhost:8000/")
      .then(res => res.json())
      .then(data => {
        setPokemonList(data.pokemons);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al conectar con el backend:", err);
        setLoading(false);
      }); */
  }, [user]);

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

  const availablePokemons = pokemonList.filter(
    p =>
      !team.some(tp => tp.name === p.name) &&
      (typeFilter === "" || (p.types && p.types.includes(typeFilter))) &&
      (generationFilter === "" || p.generation === generationFilter)
  );

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

  /* if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 60 }}>
        {!showRegister ? (
          <>
            <Login onLogin={setUser} />
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
  } */

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
          onClick={() => { setUser(null); setTeam([]); }}
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
          borderRadius: 16,
          boxShadow: "0 4px 24px #0008",
          padding: 24,
          minWidth: 700,
          minHeight: 600
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <span style={{ color: "#ffcb05", fontWeight: "bold", fontSize: 24 }}>Pokédex</span>
              <span style={{ color: "#fff", marginLeft: 16 }}>Hola, {user}</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ borderRadius: 8, padding: 4 }}>
                <option value="">Todos los tipos</option>
                {allTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select value={generationFilter} onChange={e => setGenerationFilter(e.target.value)} style={{ borderRadius: 8, padding: 4 }}>
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
            gridTemplateColumns: "repeat(10, 60px)",
            gridGap: "12px",
            background: "#888",
            borderRadius: 12,
            padding: 16,
            justifyContent: "center"
          }}>
            {availablePokemons.map((pokemon, idx) => (
              <div
                key={pokemon.name}
                style={{
                  width: 60,
                  height: 60,
                  background: "#222",
                  border: "2px solid #555",
                  borderRadius: 8,
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
                <img src={pokemon.image} alt={pokemon.name} style={{ width: 36, filter: "drop-shadow(0 0 2px #0008)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Panel Derecho (opcional) */}
      <div style={{ width: 60 }}></div>
    </div>
  );
}

export default App;