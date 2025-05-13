import React, { useEffect, useState } from 'react';
import Register from './Register';
import Login from './Login';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // Nuevo estado para el usuario autenticado
  const [showRegister, setShowRegister] = useState(false); // Controla si mostrar registro

  useEffect(() => {
  if (!user) {
    setLoading(false); // <- Añade esto para quitar la pantalla de carga si no hay usuario
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
    });
}, [user]);

  // Añadir un Pokémon al equipo
  const addToTeam = (pokemon) => {
    if (team.length < 6 && !team.some(p => p.name === pokemon.name)) {
      setTeam([...team, pokemon]);
    }
  };

  // Quitar un Pokémon del equipo
  const removeFromTeam = (pokemon) => {
    setTeam(team.filter(p => p.name !== pokemon.name));
  };

  // Filtrar los Pokémon que no están en el equipo
  const availablePokemons = pokemonList.filter(
    p => !team.some(tp => tp.name === p.name)
  );

  // Componente de pantalla de carga
  const LoadingScreen = () => (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#fff",
      zIndex: 9999
    }}>
      <h1 style={{ fontFamily: "monospace", fontSize: "2.5rem", marginBottom: "24px", color: "#121212" }}>Pokemon</h1>
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
      {/* Animación CSS */}
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

  // Si está cargando, mostrar pantalla de carga
  if (loading) return <LoadingScreen />;

  // Si no hay usuario autenticado, mostrar login o registro
  if (!user) {
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
  }

  // Si hay usuario autenticado, mostrar la app principal
  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", minHeight: "100vh" }}>
        {/* Contenedor izquierdo: equipo */}
        <div
          style={{
            width: "120px",
            background: "#e0e0e0",
            padding: "12px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <h3 style={{ fontSize: "1rem", margin: "0 0 8px 0" }}>Equipo</h3>
          {team.map((pokemon, idx) => (
            <div
              key={pokemon.name}
              style={{
                width: "60px",
                textAlign: "center",
                border: "1px solid #bbb",
                borderRadius: "8px",
                padding: "4px",
                background: "#fff",
                cursor: "pointer"
              }}
              onClick={() => removeFromTeam(pokemon)}
              title="Quitar del equipo"
            >
              <img src={pokemon.image} alt={pokemon.name} style={{ width: "40px" }} />
              <div style={{ fontSize: "0.8rem" }}>{pokemon.name}</div>
            </div>
          ))}
          {team.length === 0 && (
            <div style={{ color: "#888", fontSize: "0.9rem" }}>Vacío</div>
          )}
        </div>

        {/* Contenedor derecho: vista principal */}
        <div style={{ flex: 1, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <span style={{ marginRight: 12 }}>Hola, {user}</span>
            <button onClick={() => { setUser(null); setTeam([]); }}>Cerrar sesión</button>
          </div>
          <h1>Los 151 Pokémon originales</h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              justifyContent: "center"
            }}
          >
            {availablePokemons.map((pokemon, index) => (
              <div
                key={pokemon.name}
                style={{
                  width: "120px",
                  textAlign: "center",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "8px",
                  background: "#fafafa",
                  opacity: team.length >= 6 ? 0.5 : 1,
                  cursor: team.length < 6 ? "pointer" : "not-allowed"
                }}
                onClick={() => addToTeam(pokemon)}
                title={team.length < 6 ? "Añadir al equipo" : "Equipo lleno"}
              >
                {index + 1}. {pokemon.name}
                <br />
                <img src={pokemon.image} alt={pokemon.name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;