# Netlify Functions - Routing Correcto

## ✅ Estructura Simplificada

Se ha simplificado la arquitectura a **una sola Netlify Function** que maneja todas las rutas API:

```
netlify/functions/
├── api.js           ← 🎯 ÚNICA FUNCTION - Maneja TODAS las rutas
├── db.js            ← Helper: MongoDB connection
└── utils.js         ← Helper: ID generation, response formatting
```

---

## 🔄 Cómo Funciona el Routing

### 1. Frontend hace request
```javascript
fetch('/api/groups', { method: 'POST' })
```

### 2. Netlify intercepta
```
POST /api/groups
    ↓
Coincide con redirect: from = "/api/*"
```

### 3. Redirige a function
```
to = "/.netlify/functions/api"
    ↓
Ejecuta: netlify/functions/api.js
```

### 4. Function procesa request
```javascript
// En netlify/functions/api.js

exports.handler = async (event, context) => {
  // event.path = "/api/groups"
  // event.httpMethod = "POST"
  // event.body = JSON string

  // Usar regex para determinar qué endpoint es
  if (method === 'POST' && path === '/api/groups') {
    // Crear grupo
  }
  if (method === 'GET' && path.match(/^\/api\/groups\/([^/]+)$/)) {
    // Obtener grupo por ID
  }
  // ... más rutas
};
```

---

## 📍 Rutas Soportadas

La function `api.js` maneja:

### Grupos
```
POST   /api/groups              ← Crear grupo
GET    /api/groups/:groupId     ← Obtener grupo
```

### Usuarios
```
POST   /api/groups/:groupId/users              ← Crear/obtener usuario
GET    /api/groups/:groupId/users              ← Listar usuarios
```

### Regalos
```
POST   /api/groups/:groupId/users/:userId/gifts    ← Crear regalo
GET    /api/groups/:groupId/users/:userId/gifts    ← Regalos del usuario
GET    /api/groups/:groupId/gifts                  ← Todos los regalos del grupo
PUT    /api/gifts/:giftId/lock                     ← Bloquear regalo
PUT    /api/gifts/:giftId/unlock                   ← Desbloquear regalo
DELETE /api/gifts/:giftId                          ← Eliminar regalo
```

---

## 🎯 netlify.toml - Redirect Correcto

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200
  force = true
```

**Qué hace:**
- Cualquier request a `/api/*` se redirige a `api.js`
- `event.path` contiene la ruta completa (ej: `/api/groups/123/users`)
- `event.httpMethod` contiene el método (GET, POST, PUT, DELETE)
- `event.body` contiene el JSON del request body

**Ejemplo:**
```
POST /api/groups/123/users
    ↓
Redirect a /.netlify/functions/api
    ↓
event.path = "/api/groups/123/users"
event.httpMethod = "POST"
event.body = "{ \"name\": \"Alice\" }"
```

---

## 💡 Ventajas de una Sola Function

✅ **Más simple** - Un archivo en lugar de 5
✅ **Manejo centralizado** - Toda la lógica en un lugar
✅ **Caching de conexión** - MongoDB connection se reutiliza
✅ **Menos inicializaciones** - Menos cold starts
✅ **Más fácil de debuggear** - Un archivo a revisar

---

## 🚀 URL Correctas

### ❌ INCORRECTO (no llames directamente):
```
https://queregalo.netlify.app/.netlify/functions/api
https://queregalo.netlify.app/.netlify/functions/db
```

### ✅ CORRECTO (frontend hace estos calls):
```javascript
fetch('/api/groups')
fetch('/api/groups/123')
fetch('/api/groups/123/users')
fetch('/api/groups/123/users/456/gifts')
fetch('/api/gifts/789/lock')
```

**Netlify automáticamente redirige** `/api/*` a `/.netlify/functions/api`

---

## 🔍 Verificar que Funciona

1. Abre DevTools (F12)
2. Ve a Network tab
3. Crea un grupo
4. Busca el request a `/api/groups`
5. Debería:
   - Ir a `/api/groups` (NO a `/.netlify/functions/...`)
   - Recibir respuesta 200 con JSON
   - El redirect es interno de Netlify (no lo ves en Network)

---

## 📁 Archivos Obsoletos

Los siguientes archivos ya NO se usan y pueden ser eliminados:
- `netlify/functions/groups.js` ❌
- `netlify/functions/users.js` ❌
- `netlify/functions/gifts.js` ❌

Se consolidaron en `netlify/functions/api.js` ✅

---

## 🎓 Resumen Técnico

**Antes (complicado):**
```
/api/groups       → groups.js
/api/users        → users.js  (pero no existe realmente)
/api/gifts        → gifts.js  (pero no existe realmente)
```

**Ahora (correcto):**
```
/api/*  → api.js  (un archivo maneja TODO)
         ↓
         Parsea event.path
         ↓
         Determina qué endpoint es
         ↓
         Ejecuta la lógica correspondiente
```

---

## ✨ Conclusión

Tu app ahora tiene:
- ✅ Un routing claro y centrali zado
- ✅ URLs correctas sin confusion
- ✅ Una sola function que maneja todo
- ✅ Performance optimizado
- ✅ Fácil de mantener

**¡Listo para Netlify!** 🚀
