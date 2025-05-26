# Pokémon Game

Este proyecto es una aplicación web de combate y colección de Pokémon, con backend en FastAPI y frontend en React.

## Estructura del proyecto

```
.
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── wait-for-it.sh
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .gitignore
```

## Requisitos

- Docker y Docker Compose

## Instalación y ejecución

1. **Clona el repositorio:**

   ```sh
   git clone <URL-del-repo>
   cd <carpeta-del-proyecto>
   ```

2. **Levanta los servicios (backend, frontend y base de datos):**

   ```sh
   docker-compose up --build
   ```

   Esto levantará:
   - Backend en [http://localhost:8000](http://localhost:8000)
   - Frontend en [http://localhost:3000](http://localhost:3000)
   - MySQL en el puerto 3306

3. **Accede a la aplicación:**

   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Funcionalidades principales

- **Registro e inicio de sesión de usuarios** (con almacenamiento seguro en MySQL)
- **Pokédex**: Explora, filtra y selecciona Pokémon para tu equipo.
- **Equipo Aleatorio**: Botón para seleccionar entre 3 y 6 Pokémon aleatorios de la lista filtrada y comenzar un combate con ellos.
- **Combate**: Lucha contra Pokémon salvajes con tu equipo, con historial de combate visual y mensajes coloreados.
- **Persistencia de usuarios**: Los usuarios se almacenan en la base de datos.
- **Filtros avanzados**: Filtra Pokémon por tipo y generación.
- **Interfaz responsiva**: Adaptada a escritorio y móvil.

## Variables de entorno

Las credenciales de la base de datos están definidas en `docker-compose.yml`:

```yml
MYSQL_ROOT_PASSWORD: rootpassword
MYSQL_DATABASE: pokedb
MYSQL_USER: user
MYSQL_PASSWORD: userpassword
```

## Estructura de carpetas

- `backend/app/`: Código fuente del backend (FastAPI)
- `frontend/src/`: Código fuente del frontend (React)
- `docker-compose.yml`: Orquestación de servicios

## Notas de desarrollo

- El backend expone endpoints REST para autenticación y obtención de datos de Pokémon.
- El frontend consume estos endpoints y gestiona la experiencia de usuario.
- El combate muestra mensajes de acciones con colores y estilos HTML.
- El botón "Equipo Aleatorio" en la Pokédex selecciona Pokémon de manera aleatoria para una experiencia más atrevida.
- Para desarrollo local sin Docker, instala dependencias en cada carpeta y ejecuta los servidores manualmente.

## Créditos

- [PokéAPI](https://pokeapi.co/) para los datos de Pokémon.
- FastAPI, React, MySQL.

---

¡Atrapa todos los Pokémon y disfruta del combate!