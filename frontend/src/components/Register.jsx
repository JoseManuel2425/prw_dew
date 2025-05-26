import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Componente de registro de usuario
function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const navigate = useNavigate();

  // Maneja el registro de usuario
  const handleRegister = async () => {
    if (password !== repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registro exitoso");
        if (onRegister) onRegister();
        localStorage.setItem("user", JSON.stringify(username));
        navigate("/pokedex");
      } else {
        alert(data.message || "Error al registrar");
      }
    } catch (err) {
      alert("Error de red al intentar registrarse");
      console.error(err);
    }
  };

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
          }}
        >
          Registro de usuario
        </h2>
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
            fontSize: "1rem",
            background: "#222",
            color: "#fff",
            outline: "none"
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
            fontSize: "1rem",
            background: "#222",
            color: "#fff",
            outline: "none"
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
            fontSize: "1rem",
            background: "#222",
            color: "#fff",
            outline: "none"
          }}
        />
        <button
          onClick={handleRegister}
          style={{
            background: "#ffcb05",
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
        <button
          onClick={() => navigate("/login")}
          style={{
            marginTop: 16,
            background: "#ffcb05",
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
          Volver
        </button>
      </div>
    </div>
  );
}

export default Register;