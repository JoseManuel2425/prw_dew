import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(username);
        localStorage.setItem("user", JSON.stringify(username));
        navigate("/Pokedex");
      } else {
        alert(data.detail || "Error al iniciar sesión");
      }
    } catch (err) {
      alert("Error en onLogin: " + err.message);
      console.error(err);
    }
  };

  // Color rojo de la Pokédex: #b71c1c
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(circle at 50% 50%, #888 0%, #444 60%, #222 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "340px",
          minWidth: "320px",
          maxWidth: "400px",
          width: "90%",
          background: "#444",
          borderRadius: "16px",
          boxShadow: "0 4px 24px #0008",
          padding: "32px 28px",
          margin: "32px 0",
        }}
      >
        <h2
          style={{
            marginBottom: 24,
            fontFamily: "monospace",
            color: "#ffcb05",
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          Iniciar sesión
        </h2>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            marginBottom: 16,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #bbb",
            width: "100%",
            fontSize: "1rem",
            background: "#222",
            color: "#fff",
            outline: "none",
          }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            marginBottom: 24,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #bbb",
            width: "100%",
            fontSize: "1rem",
            background: "#222",
            color: "#fff",
            outline: "none",
          }}
        />
        <button
          onClick={handleLogin}
          style={{
            background: "#ffcb05", // <-- Solo amarillo
            color: "#222",
            border: "none",
            borderRadius: "8px",
            padding: "10px 0",
            width: "100%",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px #0001",
            marginBottom: 8,
            transition: "background 0.2s",
          }}
        >
          Entrar
        </button>

        <button
          onClick={() => navigate("/register")}
          style={{
            marginTop: 8,
            background: "#ffcb05", // <-- Solo amarillo
            color: "#222",
            border: "none",
            borderRadius: "8px",
            padding: "10px 0",
            width: "100%",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px #0002",
            transition: "background 0.2s",
          }}
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}

export default Login;