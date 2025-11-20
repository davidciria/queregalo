# Guía de Testing Local - QueRegalo

## 🐳 Opción 1: Testing con Docker Compose (Recomendado)

Docker Compose levanta MongoDB localmente + la app en un contenedor, exactamente como funcionará en Netlify.

### Requisitos
- Docker y Docker Compose instalados
- Puerto 3000 y 27017 disponibles

### Pasos

1. **Detener servidor anterior (si está corriendo)**
```bash
pkill -f "node app.js"
```

2. **Limpiar contenedores viejos (opcional)**
```bash
docker-compose down
```

3. **Levantar los servicios**
```bash
docker-compose up --build
```

4. **Esperar a que inicie**
Verás:
```
queregalo-app     | ✅ Servidor escuchando en puerto 3000
queregalo-app     | 🌐 Abre http://localhost:3000
```

5. **Abrir la app**
Abre http://localhost:3000 en tu navegador

### Verifica que funciona

1. **Crear grupo**
   - Haz clic en "Crear Grupo"
   - Escribe tu nombre
   - Debería crear el grupo y guardar en MongoDB

2. **Crear regalo**
   - Click "Añadir regalo"
   - Añade: nombre, precio, ubicación
   - Debería guardarse en MongoDB

3. **Ver datos en MongoDB**
```bash
# En otra terminal:
docker exec queregalo-mongodb mongosh
# Luego:
> use queregalo
> db.groups.find()
> db.gifts.find()
```

4. **Detener servicios**
```bash
docker-compose down
```

---

## 💻 Opción 2: Testing Local (No Docker)

Si prefieres sin Docker, acepta que tendrá problemas de SSL con MongoDB Atlas desde OrangePi.

### Alternativa: Usa MongoDB local con Docker

```bash
# Solo mongoDB en Docker
docker run -d -p 27017:27017 --name queregalo-mongo mongo:7

# Actualiza .env
MONGODB_URI=mongodb://localhost:27017/queregalo

# Inicia Express
cd server
npm install
npm start
```

---

## 📊 Verificar que MongoDB funciona

### Con Docker Compose

```bash
# Conectar a MongoDB dentro del contenedor
docker exec queregalo-mongodb mongosh

# Ver bases de datos
> show databases

# Ver colecciones de queregalo
> use queregalo
> show collections
> db.groups.find()
```

### Desde host local

```bash
# Si instalaste mongosh localmente
mongosh mongodb://localhost:27017/queregalo
```

---

## 🔍 Troubleshooting

| Problema | Solución |
|----------|----------|
| Error: "Cannot connect to MongoDB" | Verifica que MongoDB está corriendo: `docker ps` |
| Puerto 3000 en uso | `lsof -i :3000` y mata el proceso |
| Puerto 27017 en uso | `lsof -i :27017` y mata el proceso |
| Build failure en Docker | `docker-compose build --no-cache` |
| Vol ver logs | `docker-compose logs queregalo` |

---

## 📝 Flujo de Trabajo Recomendado

1. **Desarrollo**: `docker-compose up`
2. **Cambios en código**: Automáticos (volúmenes enlazados)
3. **Testear**: http://localhost:3000
4. **Ver logs**: `docker-compose logs -f queregalo`
5. **Verificar datos**: `docker exec queregalo-mongodb mongosh`
6. **Detener**: `docker-compose down`

---

## ✅ Una vez funciona localmente

1. Todos los endpoints funcionan
2. MongoDB persiste datos
3. Los datos sincronizaban entre pestañas
4. Estás listo para desplegar a Netlify

→ Sigue las instrucciones en [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)
