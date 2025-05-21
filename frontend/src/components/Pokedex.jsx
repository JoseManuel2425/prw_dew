import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function getResponsiveGrid() {
    const width = window.innerWidth;
    if (width <= 500) return { cols: 2, pageSize: 8 };
    if (width <= 700) return { cols: 3, pageSize: 12 };
    if (width <= 900) return { cols: 5, pageSize: 20 };
    if (width <= 1200) return { cols: 7, pageSize: 35 };
    return { cols: 10, pageSize: 60 };
}

function Pokedex({ user, setUser, pokemonList, loadingPokemons }) {
    const [team, setTeam] = useState([]);
    const [typeFilter, setTypeFilter] = useState("");
    const [generationFilter, setGenerationFilter] = useState("");
    const [page, setPage] = useState(1);
    const [gridConfig, setGridConfig] = useState(getResponsiveGrid());
    const navigate = useNavigate();

    // Traduccion de tipos
    const TYPE_TRANSLATIONS = {
        normal: "Normal",
        fire: "Fuego",
        water: "Agua",
        electric: "Eléctrico",
        grass: "Planta",
        ice: "Hielo",
        fighting: "Lucha",
        poison: "Veneno",
        ground: "Tierra",
        flying: "Volador",
        psychic: "Psíquico",
        bug: "Bicho",
        rock: "Roca",
        ghost: "Fantasma",
        dragon: "Dragón",
        dark: "Siniestro",
        steel: "Acero",
        fairy: "Hada"
    };

    // Selector de cuadrícula y equipo
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [focusArea, setFocusArea] = useState("grid"); // "grid" o "team"
    const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);

    // Responsive: actualizar columnas y pageSize al cambiar tamaño ventana
    useEffect(() => {
        function handleResize() {
            setGridConfig(getResponsiveGrid());
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const allTypes = Array.from(new Set(pokemonList.flatMap(p => p.types || [])));
    const allGenerations = Array.from(new Set(pokemonList.map(p => p.generation))).sort();

    const addToTeam = (pokemon) => {
        if (team.length < 6 && !team.some(p => p.name === pokemon.name)) {
            setTeam([...team, pokemon]);
        }
    };

    const removeFromTeam = (pokemon) => {
        setTeam(team.filter(p => p.name !== pokemon.name));
    };

    // Filtros y paginación
    const filteredPokemons = pokemonList.filter(
        p =>
            !team.some(tp => tp.name === p.name) &&
            (typeFilter === "" || (p.types && p.types.includes(typeFilter))) &&
            (generationFilter === "" || p.generation === generationFilter)
    );

    const totalPages = Math.ceil(filteredPokemons.length / gridConfig.pageSize);
    const paginatedPokemons = filteredPokemons.slice((page - 1) * gridConfig.pageSize, page * gridConfig.pageSize);

    // Si cambian los filtros, resetea selector y página
    useEffect(() => {
        setSelectedIndex(0);
        setPage(1);
        setFocusArea("grid");
    }, [typeFilter, generationFilter, gridConfig.pageSize]);

    // Si cambia la página, resetea el selector de cuadrícula
    useEffect(() => {
        setSelectedIndex(0);
        setFocusArea("grid");
    }, [page]);

    // Si cambia el equipo y el índice seleccionado es inválido, ajústalo
    useEffect(() => {
        if (selectedTeamIndex >= team.length && team.length > 0) {
            setSelectedTeamIndex(team.length - 1);
        }
    }, [team, selectedTeamIndex]);

    // Manejo de teclado para mover el selector y alternar entre grid/equipo
    const handleKeyDown = useCallback(
        (e) => {
            if (!user) return;

            // Cambiar foco con Tab
            if (e.key === "Tab") {
                e.preventDefault();
                if (focusArea === "grid" && team.length > 0) {
                    setFocusArea("team");
                    setSelectedTeamIndex(0);
                } else {
                    setFocusArea("grid");
                }
                return;
            }

            // --- Selector en cuadrícula principal ---
            if (focusArea === "grid" && paginatedPokemons.length > 0) {
                const cols = gridConfig.cols;
                const rows = Math.ceil(gridConfig.pageSize / cols);
                let row = Math.floor(selectedIndex / cols);
                let col = selectedIndex % cols;

                switch (e.key) {
                    case "ArrowRight":
                        e.preventDefault();
                        if (col < cols - 1 && selectedIndex + 1 < paginatedPokemons.length) setSelectedIndex(selectedIndex + 1);
                        break;
                    case "ArrowLeft":
                        e.preventDefault();
                        if (col > 0) setSelectedIndex(selectedIndex - 1);
                        break;
                    case "ArrowDown":
                        e.preventDefault();
                        if (row < rows - 1 && selectedIndex + cols < paginatedPokemons.length) setSelectedIndex(selectedIndex + cols);
                        break;
                    case "ArrowUp":
                        e.preventDefault();
                        if (row > 0) setSelectedIndex(selectedIndex - cols);
                        break;
                    case "Enter":
                        const selected = paginatedPokemons[selectedIndex];
                        if (selected) addToTeam(selected);
                        break;
                    default:
                        break;
                }
            }

            // --- Selector en equipo ---
            if (focusArea === "team" && team.length > 0) {
                switch (e.key) {
                    case "ArrowDown":
                        e.preventDefault();
                        if (selectedTeamIndex < team.length - 1) setSelectedTeamIndex(selectedTeamIndex + 1);
                        break;
                    case "ArrowUp":
                        e.preventDefault();
                        if (selectedTeamIndex > 0) setSelectedTeamIndex(selectedTeamIndex - 1);
                        break;
                    case "Enter":
                        removeFromTeam(team[selectedTeamIndex]);
                        break;
                    default:
                        break;
                }
            }
        },
        [selectedIndex, paginatedPokemons, user, focusArea, team, selectedTeamIndex, gridConfig]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const selectedPokemon = paginatedPokemons[selectedIndex];

    const LoadingScreen = () => (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: "#222",
                zIndex: 9999,
            }}
        >
            <h1 style={{ fontFamily: "monospace", fontSize: "2.5rem", marginBottom: "24px", color: "#ffcb05" }}>
                Pokédex
            </h1>
            <div
                style={{
                    width: "220px",
                    height: "18px",
                    background: "#eee",
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px #0002",
                }}
            >
                <div
                    className="loading-bar"
                    style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, #ffcb05 40%, #3b4cca 100%)",
                        animation: "loadingBar 1.2s linear infinite",
                    }}
                />
            </div>
            <style>
                {`
                @keyframes loadingBar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .loading-bar {
                    transform: translateX(-100%);
                    animation: loadingBar 1.2s linear infinite;
                }
                `}
            </style>
        </div>
    );

    if (loadingPokemons) return <LoadingScreen />;

    return (
        <div className="pokedex-root" style={{
            display: "flex",
            height: "100vh",
            background: "#222",
            fontFamily: "monospace",
            boxSizing: "border-box",
            width: "100%",
            overflow: "hidden"
        }}>
            {/* Estilos responsivos */}
            <style>
                {`
                .pokedex-main, .pokedex-grid {
                    box-sizing: border-box;
                }
                @media (max-width: 900px) {
                    .pokedex-root {
                        flex-direction: column !important;
                    }
                    .pokedex-sidebar {
                        width: 100% !important;
                        border-radius: 0 0 16px 16px !important;
                        flex-direction: column !important;
                        justify-content: flex-start !important;
                        align-items: stretch !important;
                        padding: 12px 0 !important;
                        min-height: unset !important;
                        max-width: 100vw !important;
                    }
                    .pokedex-header {
                        order: 1;
                        text-align: center !important;
                        margin-bottom: 12px !important;
                        width: 100%;
                    }
                    .logout-btn {
                        order: 2;
                        display: block;
                        margin: 0 auto 24px auto !important;
                        width: auto !important;
                        min-width: 120px;
                        max-width: 200px;
                        text-align: center;
                    }
                    .pokedex-selected { order: 3; }
                    .pokedex-team {
                        order: 4;
                        width: 96% !important;
                        margin: 16px auto 0 auto !important;
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: wrap;
                        justify-content: center;
                        align-items: center;
                        gap: 8px;
                    }
                    .pokedex-team > div {
                        margin: 0 4px !important;
                        min-width: 60px;
                    }
                }
                @media (max-width: 700px) {
                    .pokedex-main {
                        min-width: 0 !important;
                        width: 100% !important;
                        padding: 8px !important;
                        max-width: 100vw !important;
                    }
                    .pokedex-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        padding: 8px !important;
                        grid-gap: 8px !important;
                    }
                }
                @media (max-width: 500px) {
                    .pokedex-main {
                        min-width: 0 !important;
                        width: 100% !important;
                        padding: 2px !important;
                        max-width: 100vw !important;
                    }
                    .pokedex-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        padding: 2px !important;
                        grid-gap: 4px !important;
                    }
                }
                `}
            </style>
            {/* Panel Izquierdo */}
            <div className="pokedex-sidebar" style={{
                width: 220,
                background: "#b71c1c",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px 0",
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
                boxShadow: "2px 0 8px #0008",
                zIndex: 2
            }}>
                <div className="pokedex-header" style={{
                    fontWeight: "bold",
                    fontSize: 22,
                    marginBottom: 24,
                    letterSpacing: 2
                }}>Pokédex</div>
                {/* Botón cerrar sesión debajo del título */}
                <button
                    className="logout-btn"
                    onClick={() => {
                        setUser(null);
                        setTeam([]);
                        localStorage.removeItem("user");
                    }}
                    style={{
                        marginBottom: 24,
                        background: "#fff2",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Cerrar sesión
                </button>
                {/* Detalle del Pokémon seleccionado */}
                {selectedPokemon && (
                    <div className="pokedex-selected" style={{
                        background: "#fff2",
                        borderRadius: 8,
                        padding: "12px 0",
                        width: "80%",
                        margin: "0 auto 24px auto",
                        textAlign: "center",
                        boxShadow: "0 2px 8px #0003"
                    }}>
                        <div style={{ fontWeight: "bold", color: "#222", marginBottom: 4 }}>
                            #{selectedPokemon.id || (pokemonList.findIndex(p => p.name === selectedPokemon.name) + 1)}
                        </div>
                        <img src={selectedPokemon.image} alt={selectedPokemon.name} style={{ width: 48, marginBottom: 4 }} />
                        <div style={{ color: "#222", fontSize: "1rem" }}>{selectedPokemon.name}</div>
                    </div>
                )}
                {/* Equipo */}
                <div className="pokedex-team" style={{
                    background: "#fff2",
                    borderRadius: 8,
                    padding: "8px 0",
                    width: "80%",
                    margin: "0 auto 24px auto",
                    textAlign: "center"
                }}>
                    <div style={{ marginBottom: 8 }}>Equipo</div>
                    {team.map((pokemon, idx) => (
                        <div
                            key={pokemon.name}
                            style={{
                                margin: "4px 0",
                                background: focusArea === "team" && selectedTeamIndex === idx ? "#ffcb05" : "#fff3",
                                borderRadius: 6,
                                padding: 2,
                                cursor: "pointer",
                                color: focusArea === "team" && selectedTeamIndex === idx ? "#222" : undefined,
                                fontWeight: focusArea === "team" && selectedTeamIndex === idx ? "bold" : undefined,
                                outline: focusArea === "team" && selectedTeamIndex === idx ? "2px solid #ffcb05" : "none"
                            }}
                            onClick={() => removeFromTeam(pokemon)}
                            onMouseEnter={() => {
                                setFocusArea("team");
                                setSelectedTeamIndex(idx);
                            }}
                            title="Quitar del equipo"
                        >
                            <img src={pokemon.image} alt={pokemon.name} style={{ width: 32, display: "block", margin: "0 auto" }} />
                            <div style={{ fontSize: "0.8rem" }}>{pokemon.name}</div>
                        </div>
                    ))}
                    {team.length === 0 && (
                        <div style={{ color: "#fff8", fontSize: "0.9rem" }}>Vacío</div>
                    )}
                </div>
            </div>

            {/* Panel Central */}
            <div className="pokedex-main" style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "8px 0 0 0", // <--- Reduce el padding superior
                margin: "0 auto",
                width: "100%",
                maxWidth: "1400px",
                boxSizing: "border-box",
                zIndex: 1
            }}>
                <div style={{
                    background: "#444",
                    borderRadius: 24,
                    boxShadow: "0 4px 24px #0008",
                    padding: 16, // <--- Reduce el padding interno
                    width: "100%",
                    maxWidth: "1400px",
                    boxSizing: "border-box"
                }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 32 }}>
                        <div>
                            <span style={{ color: "#ffcb05", fontWeight: "bold", fontSize: 32 }}>Pokédex</span>
                            <span style={{ color: "#fff", marginLeft: 24, fontSize: 20 }}>Hola, {user}</span>
                        </div>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            <button
                                onClick={() => navigate("/combat", { state: { team } })}
                                style={{ background: "#ffcb05", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: "bold", cursor: "pointer" }}
                            >
                                Ir a Combate
                            </button>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ borderRadius: 12, padding: 8, fontSize: 16 }}>
                                <option value="">Todos los tipos</option>
                                {allTypes.map(type => (
                                    <option key={type} value={type}>
                                        {TYPE_TRANSLATIONS[type] || type}
                                    </option>
                                ))}
                            </select>
                            <select value={generationFilter} onChange={e => setGenerationFilter(e.target.value)} style={{ borderRadius: 12, padding: 8, fontSize: 16 }}>
                                <option value="">Todas las generaciones</option>
                                {allGenerations.map(gen => (
                                    <option key={gen} value={gen}>{gen.replace('generation-', 'Gen ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Cuadrícula de Pokémon */}
                    <div className="pokedex-grid" style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${gridConfig.cols}, 90px)`,
                        gridGap: "18px",
                        background: "#888",
                        borderRadius: 18,
                        padding: 24,
                        justifyContent: "center",
                        boxSizing: "border-box"
                    }}>
                        {paginatedPokemons.map((pokemon, idx) => (
                            <div
                                key={pokemon.name}
                                style={{
                                    width: 90,
                                    height: 90,
                                    background: "#222",
                                    border: focusArea === "grid" && selectedIndex === idx ? "3px solid #ffcb05" : "3px solid #555",
                                    borderRadius: 12,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: team.length < 6 ? "pointer" : "not-allowed",
                                    opacity: team.length >= 6 ? 0.5 : 1,
                                    transition: "box-shadow 0.2s, border 0.2s",
                                    boxShadow: focusArea === "grid" && selectedIndex === idx ? "0 0 16px #ffcb0588" : "0 2px 8px #0004"
                                }}
                                onClick={() => addToTeam(pokemon)}
                                onMouseEnter={() => {
                                    setFocusArea("grid");
                                    setSelectedIndex(idx);
                                }}
                                title={team.length < 6 ? "Añadir al equipo" : "Equipo lleno"}
                            >
                                <img src={pokemon.image} alt={pokemon.name} style={{ width: 48, filter: "drop-shadow(0 0 2px #0008)" }} />
                            </div>
                        ))}
                    </div>
                    {/* Paginación */}
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 24, gap: 16, flexWrap: "wrap" }}>
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            style={{
                                padding: "8px 18px",
                                borderRadius: 8,
                                border: "none",
                                background: "#ffcb05",
                                color: "#222",
                                fontWeight: "bold",
                                fontSize: 18,
                                cursor: page === 1 ? "not-allowed" : "pointer",
                                opacity: page === 1 ? 0.5 : 1
                            }}
                        >Anterior</button>
                        <span style={{ color: "#fff", fontSize: 18, alignSelf: "center" }}>
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            style={{
                                padding: "8px 18px",
                                borderRadius: 8,
                                border: "none",
                                background: "#ffcb05",
                                color: "#222",
                                fontWeight: "bold",
                                fontSize: 18,
                                cursor: page === totalPages ? "not-allowed" : "pointer",
                                opacity: page === totalPages ? 0.5 : 1
                            }}
                        >Siguiente</button>
                    </div>
                </div>
            </div>
            {/* Panel Derecho (opcional) */}
            <div style={{ width: 0, minWidth: 0 }}></div>
        </div>
    );
}

export default Pokedex;