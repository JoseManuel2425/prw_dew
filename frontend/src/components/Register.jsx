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

    const response = await fetch("http://localhost:8000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
      alert("Registro exitoso");
      if (onRegister) onRegister(); // Llama a onRegister si se pasó como prop
    } else {
      alert(data.message || "Error al registrar");
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "0 auto", textAlign: "center" }}>
      <h2>Registro de usuario</h2>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{
          marginBottom: 12,
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
          marginBottom: 12,
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
