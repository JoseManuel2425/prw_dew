import React, { useState } from 'react';

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
<<<<<<< Updated upstream:frontend/src/Register.jsx
=======
    if (password !== repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
>>>>>>> Stashed changes:frontend/src/components/Register.jsx
    const response = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
<<<<<<< Updated upstream:frontend/src/Register.jsx
    alert(data.message);
=======
    if (response.ok) {
      alert("Registro exitoso");
      onRegister();
    } else {
      alert(username || "Error al registrar");
    }
>>>>>>> Stashed changes:frontend/src/components/Register.jsx
  };

  return (
    <div>
      <h2>Registro de usuario</h2>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
<<<<<<< Updated upstream:frontend/src/Register.jsx
      <button onClick={handleRegister}>Registrarse</button>
=======
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
      <button onClick={handleRegister}
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
        }}>Registrarse</button>
>>>>>>> Stashed changes:frontend/src/components/Register.jsx
    </div>
  );
}

export default Register;
