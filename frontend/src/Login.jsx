import React, { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const response = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      onLogin(username);
    } else {
      alert(data.detail || "Error al iniciar sesión");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "340px",
      minWidth: "320px",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 4px 24px #0002",
      padding: "32px 28px",
      margin: "32px 0"
    }}>
      <h2 style={{
        marginBottom: 24,
        fontFamily: "monospace",
        color: "#3b4cca",
        fontWeight: 700
      }}>Iniciar sesión</h2>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{
          marginBottom: 16,
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #bbb",
          width: "100%",
          fontSize: "1rem"
        }}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{
          marginBottom: 24,
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #bbb",
          width: "100%",
          fontSize: "1rem"
        }}
      />
      <button
        onClick={handleLogin}
        style={{
          background: "linear-gradient(90deg, #ffcb05 60%, #3b4cca 100%)",
          color: "#222",
          border: "none",
          borderRadius: "8px",
          padding: "10px 0",
          width: "100%",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px #0001"
        }}
      >
        Entrar
      </button>
    </div>
  );
}

export default Login;