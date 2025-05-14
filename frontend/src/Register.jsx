import React, { useState } from 'react';

function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const handleRegister = async () => {
    if (password !== repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    const response = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      onRegister();
    } else {
      alert(data.detail || "Error al registrar");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "380px",
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
      }}>Registro de usuario</h2>
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
        placeholder="Repetir contraseña"
        value={repeatPassword}
        onChange={e => setRepeatPassword(e.target.value)}
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
        onClick={handleRegister}
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
        Registrarse
      </button>
    </div>
  );
}

export default Register;