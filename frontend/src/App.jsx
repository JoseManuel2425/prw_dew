import React, { useEffect, useState } from 'react';
import Register from './Register';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [view, setView] = useState("home");
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true); // Nuevo estado

  useEffect(() => {
  // Solo cargar una vez al montar el componente
  fetch("http://localhost:8000/")
    .then(res => res.json())
    .then(data => {
      setPokemonList(data.pokemons);
      setLoading(false); // Ocultar loading cuando termina
    })
    .catch(err => {
      console.error("Error al conectar con el backend:", err);
      setLoading(false);
    });
  }, []);

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

  return (
    <>
      {loading && <LoadingScreen />}
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
          <button onClick={() => setView("home")}>Inicio</button>
          <button onClick={() => setView("register")}>Registrarse</button>

          {view === "home" && (
            <>
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
            </>
          )}

          {view === "register" && <Register />}
        </div>
      </div>
    </>
  );
}

export default App;