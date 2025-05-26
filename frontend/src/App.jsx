import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Pokedex from "./components/Pokedex";
import Combat from "./components/Combat";

// Wrapper para el login, maneja el login y redirección
function LoginWrapper({ onLogin }) {
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    onLogin(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    navigate("/pokedex");
  };

  return <Login onLogin={handleLogin} />;
}

// Wrapper para el registro, redirige al login tras registro
function RegisterWrapper() {
  const navigate = useNavigate();

  const handleRegisterComplete = () => {
    navigate("/login");
  };

  return <Register onRegister={handleRegisterComplete} />;
}

// Componente principal de la app
function App() {
  // Estado del usuario autenticado
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Estado global para los pokemons y su carga
  const [pokemonList, setPokemonList] = useState([]);
  const [loadingPokemons, setLoadingPokemons] = useState(true);

  // Carga la lista de pokemons al montar la app
  useEffect(() => {
    setLoadingPokemons(true);
    fetch("http://localhost:8000/")
      .then(res => res.json())
      .then(data => {
        setPokemonList(data?.pokemons || []);
        setLoadingPokemons(false);
      })
      .catch(() => {
        setPokemonList([]);
        setLoadingPokemons(false);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/pokedex" /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to="/pokedex" /> : <LoginWrapper onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/pokedex" /> : <RegisterWrapper />} />
        <Route
          path="/pokedex"
          element={
            user
              ? <Pokedex user={user} setUser={setUser} pokemonList={pokemonList} loadingPokemons={loadingPokemons} />
              : <Navigate to="/login" />
          }
        />
        <Route path="/combat" element={user ? <Combat /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;