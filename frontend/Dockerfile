FROM node:18

WORKDIR /app

# Instala dependencias primero (sin copiar toda la app aún)
COPY package*.json ./
RUN npm install

# Luego copia el resto del código
COPY . .

CMD ["npm", "start"]
