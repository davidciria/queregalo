# QueRegalo - Netlify Deployment Guide

## Architecture Overview

QueRegalo ahora usa **MongoDB Atlas** como base de datos persistente en el cloud, permitiendo que los datos se sincronicen entre dispositivos y usuarios. El servidor Express se puede desplegar en Netlify usando Netlify Functions.

## Opción 1: Despliegue con Express + Netlify (Recomendado)

### Requisitos Previos

- MongoDB Atlas cluster configurado (ya tienes uno)
- Conexión MongoDB URI en tu variable de entorno
- Cuenta de Netlify (gratis)

### Paso 1: Preparar Variables de Entorno

1. Copia `.env.example` a `.env`
2. Asegúrate de que `MONGODB_URI` contiene tu conexión a MongoDB Atlas
3. **NO hagas commit de `.env`** (Git lo ignora automáticamente)

```bash
# .env
MONGODB_URI=mongodb+srv://thedacima99_db_user:rMVdW2ZqcvV3fMyV@queregalo.aa9hovk.mongodb.net/?appName=QueRegalo
PORT=3000
NODE_ENV=production
```

### Paso 2: Conectar Repositorio a Netlify

1. Ve a https://app.netlify.com
2. Haz clic en "New site from Git"
3. Selecciona "GitHub" y autoriza
4. Selecciona el repositorio `queregalo`
5. Selecciona rama: `netlify-deployment`

### Paso 3: Configurar Build Settings

En Netlify, configura:

- **Build command**: `cd server && npm install && npm start`
- **Publish directory**: `server` (ya que Express sirve la carpeta `public`)
- **Environment variables**:
  - `MONGODB_URI`: Tu cadena de conexión MongoDB Atlas
  - `NODE_ENV`: `production`

### Paso 4: Crear Archivo `Procfile` (Importante)

Crea un archivo `Procfile` en la raíz del proyecto:

```
web: npm start --prefix server
```

Este archivo le dice a Netlify cómo ejecutar tu servidor.

### Paso 5: Desplegar

1. Haz clic en "Deploy" en Netlify
2. Espera a que termine la compilación
3. Tu sitio estará disponible en `https://your-site.netlify.app`

## Opción 2: Usar Netlify Functions + Express (Avanzado)

Si prefieres que el servidor sea completamente serverless, puedes usar Netlify Functions:

### Paso 1: Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

### Paso 2: Inicializar Proyecto

```bash
netlify init
```

### Paso 3: Crear Función Wrapper

Crea `netlify/functions/api.js`:

```javascript
const express = require('express');
const serverless = require('serverless-http');
const app = require('../../server/app');

module.exports.handler = serverless(app);
```

### Paso 4: Actualizar netlify.toml

```toml
[build]
  command = "npm install --prefix server && npm install"
  publish = "public"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Paso 5: Desplegar

```bash
netlify deploy
```

## Bases de Datos - MongoDB Atlas (Gratuito)

Tu cluster MongoDB está vacío. Los datos se crearán automáticamente cuando uses la app:

1. **Primera vez**: Se crean las colecciones `groups`, `users`, `gifts`
2. **Automático**: Los índices se crean en el primer inicio
3. **Persistente**: Los datos permanecen en MongoDB Atlas

### Verificar Datos en MongoDB

1. Ve a https://cloud.mongodb.com
2. Inicia sesión con tu cuenta
3. Ve a "Database" → "Clusters"
4. Haz clic en "Browse Collections"
5. Verás las colecciones creadas automáticamente

## Features

✅ Gift wishlist management con grupos
✅ Gift blocking/unlocking (mecanismo de sorpresa)
✅ Diseño responsive optimizado para móvil
✅ Persistencia en cloud con MongoDB Atlas
✅ Sincronización entre dispositivos
✅ IDs de grupo seguros
✅ API REST con validación
✅ Protección contra race conditions

## Variables de Entorno

**Obligatorias para despliegue**:
- `MONGODB_URI`: Conexión a MongoDB Atlas
- `NODE_ENV`: `production`
- `PORT`: `3000` (Netlify lo asigna automáticamente)

## API Endpoints

El servidor expone estos endpoints:

### Grupos
- `POST /api/groups` - Crear grupo
- `GET /api/groups/:groupId` - Obtener información del grupo

### Usuarios
- `POST /api/groups/:groupId/users` - Crear/obtener usuario
- `GET /api/groups/:groupId/users` - Listar usuarios del grupo

### Regalos
- `POST /api/groups/:groupId/users/:userId/gifts` - Añadir regalo
- `GET /api/groups/:groupId/users/:userId/gifts` - Regalos del usuario
- `GET /api/groups/:groupId/gifts` - Todos los regalos del grupo
- `PUT /api/gifts/:giftId/lock` - Bloquear regalo
- `PUT /api/gifts/:giftId/unlock` - Desbloquear regalo
- `DELETE /api/gifts/:giftId` - Eliminar regalo

## Troubleshooting

**Problema**: "Error conectando a MongoDB"
- Solución: Verifica que `MONGODB_URI` es correcta en variables de entorno de Netlify
- Verifica que tu IP está en la whitelist de MongoDB Atlas (Allow All si es necesario)

**Problema**: "Gateway Timeout" en Netlify Functions
- Solución: Las funciones tienen límite de 26 segundos. Usa despliegue tradicional (Opción 1) en su lugar

**Problema**: Page refreshes devuelven 404
- Solución: Comprueba que `netlify.toml` tiene el redirect catch-all a `index.html`

**Problema**: Los datos no persisten entre sesiones
- Solución: Verifica que MongoDB está conectado correctamente (revisa logs de Netlify)

## Flujo de Datos

```
Usuario (Navegador)
    ↓ HTTP API Calls
Netlify/Express Server
    ↓ Queries/Updates
MongoDB Atlas Cluster
```

1. Usuario abre app → Carga desde Netlify
2. Usuario crea grupo → POST `/api/groups` → MongoDB
3. Usuario añade regalo → POST `/api/gifts` → MongoDB
4. Usuario bloquea regalo → PUT `/api/gifts/:id/lock` → MongoDB
5. Otro usuario accede → GET endpoints → Lee datos de MongoDB

## Soporte

Para problemas, abre un issue: https://github.com/davidciria/queregalo/issues

## Siguiente: Datos Iniciales

Una vez desplegado, puedes:

1. Crear grupos directamente desde la app
2. Los datos se guardan automáticamente en MongoDB
3. Accede desde múltiples dispositivos con el mismo enlace del grupo
4. Los datos persisten indefinidamente
