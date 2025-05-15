import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Pokedex from "./components/Pokedex";
import Combat from "./components/Combat";

function LoginWrapper({ onLogin }) {
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    onLogin(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    navigate("/pokedex");
  };

  return <Login onLogin={handleLogin} />;
}

function RegisterWrapper() {
  const navigate = useNavigate();

  const handleRegisterComplete = () => {
    navigate("/login");
  };

  return <Register onRegister={handleRegisterComplete} />;
}

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/pokedex" /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to="/pokedex" /> : <LoginWrapper onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/pokedex" /> : <RegisterWrapper />} />
        <Route path="/pokedex" element={user ? <Pokedex user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/combat" element={user ? <Combat /> : <Navigate to="/login" />} />
        {/* Ruta catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
