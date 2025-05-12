import React, { useEffect, useState } from 'react';
import Register from './Register';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [view, setView] = useState("home");

  useEffect(() => {
    if (view === "home") {
      fetch("http://localhost:8000/")
        .then(res => res.json())
        .then(data => setPokemonList(data.pokemons))
        .catch(err => console.error("Error al conectar con el backend:", err));
    }
  }, [view]);

  return (
    <div>
      <button onClick={() => setView("home")}>Inicio</button>
      <button onClick={() => setView("register")}>Registrarse</button>

      {view === "home" && (
        <>
          <h1>Los 151 Pokémon originales</h1>
          <ul>
            {pokemonList.map((pokemon, index) => (
              <li key={index}>
                {index + 1}. {pokemon.name}
                <br />
                <img src={pokemon.image} alt={pokemon.name} />
              </li>
            ))}
          </ul>
        </>
      )}

      {view === "register" && <Register />}
    </div>
  );
}

export default App;
