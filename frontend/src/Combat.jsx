import React from 'react';

function Combat({ team }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2>¡Combate Pokémon!</h2>
      {team.length === 0 ? (
        <p>No has seleccionado ningún Pokémon aún.</p>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {team.map((pokemon) => (
            <div key={pokemon.name} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '8px',
              background: '#f5f5f5',
              width: '120px',
              textAlign: 'center'
            }}>
              <img src={pokemon.image} alt={pokemon.name} style={{ width: '80px' }} />
              <p>{pokemon.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Combat;
