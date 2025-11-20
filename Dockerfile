FROM node:18-alpine

WORKDIR /app

# Copiar archivos del servidor
COPY server/package.json server/package.json
COPY server/app.js server/app.js
COPY server/database.js server/database.js

# Copiar archivos del frontend
COPY public/ public/

# Instalar dependencias
RUN cd server && npm install

# Crear directorio para datos persistentes
RUN mkdir -p /app/data

# Exponer puerto
EXPOSE 3000

# Iniciar la aplicación
CMD ["node", "server/app.js"]
