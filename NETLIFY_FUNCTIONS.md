# QueRegalo - Netlify Functions Edition

## ✅ Solución para Netlify Free Tier

Tu aplicación ahora usa **Netlify Functions** en lugar de Express persistente. Esto es 100% compatible con el **free tier de Netlify**.

---

## 📦 Estructura de Netlify Functions

```
netlify/functions/
├── db.js              # Helper para conexión a MongoDB
├── utils.js           # Helpers para IDs, respuestas, etc.
├── groups.js          # Endpoints: POST/GET /api/groups
├── users.js           # Endpoints: POST/GET /api/groups/:id/users
└── gifts.js           # Endpoints: POST/GET/PUT/DELETE /api/gifts
```

Cada archivo se convierte automáticamente en una Netlify Function:
- `groups.js` → `/.netlify/functions/groups`
- `users.js` → `/.netlify/functions/users`
- `gifts.js` → `/.netlify/functions/gifts`

---

## 🔄 Routing Automático

**netlify.toml** configura los redirects:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

Esto significa:
- `/api/groups` → `/.netlify/functions/groups`
- `/api/groups/123/users` → `/.netlify/functions/users` (con parámetros)
- `/api/gifts/456/lock` → `/.netlify/functions/gifts` (con parámetros)

El código en las functions parsea el path y httpMethod para manejar cada caso.

---

## 🚀 Cómo Funciona

### 1. Usuario abre la app
```
https://tu-site.netlify.app
    ↓
Netlify sirve /public/index.html
```

### 2. Frontend hace request a API
```javascript
fetch('/api/groups', {
  method: 'POST',
  body: JSON.stringify({ name: 'Mi Grupo' })
})
```

### 3. Netlify redirige a Function
```
POST /api/groups
    ↓
Redirige a /.netlify/functions/groups
    ↓
Ejecuta el código en netlify/functions/groups.js
```

### 4. Function procesa request
```javascript
// En netlify/functions/groups.js
if (method === 'POST' && !path) {
  // Crear grupo
  // Conectar a MongoDB
  // Guardar datos
  // Retornar respuesta
}
```

### 5. Frontend recibe respuesta
```javascript
{
  groupId: "abc123...",
  name: "Mi Grupo"
}
```

---

## ⚙️ Configuración en Netlify Dashboard

### Build Settings
```
Build command:      npm install
Publish directory:  public
Functions dir:      netlify/functions
```

### Environment Variables
```
MONGODB_URI    = mongodb+srv://davidciria:...@cluster0...
NODE_ENV       = production
```

**Importante**: NO necesitas package.json en server/ para la variable de entorno, solo en la raíz.

---

## 💾 Package.json Structure

Ahora tienes:
- `/package.json` (raíz) - Para Netlify Functions
  - Instala `mongodb` y `uuid`
  - Utilizado por Netlify en el build

- `/server/package.json` (viejo) - Para desarrollo local
  - Puede ser eliminado o dejado como referencia

---

## 🔍 Cómo Parsean Path las Functions

Las functions usan expresiones regulares para parsear paths dinámicos:

```javascript
// En users.js
const pathMatch = event.path.match(/\/groups\/([^/]+)\/users(?:\/(.*))?/);
const groupId = pathMatch[1]; // Captura el ID del grupo
```

Esto permite:
- `POST /api/groups/123/users` → Crear usuario en grupo 123
- `GET /api/groups/123/users` → Listar usuarios de grupo 123

---

## 🧪 Testing Local

### Opción 1: Con Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Ejecutar localmente
netlify dev

# Abre: http://localhost:3000
```

### Opción 2: Con Docker

```bash
docker-compose up
```

---

## ⏱️ Limitaciones vs Ventajas

### Limitaciones (aceptables)
- ⏱️ Timeout máximo 26 segundos (tu app es muy rápida)
- 🥶 Cold start ~1 segundo primera invocación
- 🔗 Cada request reconnecta a MongoDB

### Ventajas
- ✅ Completamente **GRATIS** en free tier
- ✅ 125,000 invocaciones/mes incluidas
- ✅ Escalable automáticamente si crece
- ✅ No mantienes servidor corriendo 24/7
- ✅ Sin costos de infraestructura

---

## 📊 Costos Reales

```
Invocaciones:    125,000/mes    GRATIS
Almacenamiento:  512MB          GRATIS
Bandwidth:       100GB/mes      GRATIS
Dominio:         *.netlify.app  GRATIS

TOTAL MONTHLY: $0
```

---

## 🔧 Problemas Comunes

### Error: "Cannot find module 'mongodb'"
```
Causa:  npm install no incluyó mongodb
Solución: Verifica que package.json en raíz tiene mongodb en dependencies
```

### Error: "MONGODB_URI undefined"
```
Causa:  Variable de entorno no configurada en Netlify
Solución: Agrega MONGODB_URI en Site settings → Environment
```

### API calls muy lento (cold start)
```
Causa:  Primera invocación de la function tarda ~1s
Solución: Normal, siguiente invocación es rápida. Aceptable.
```

### 404 en archivos estáticos
```
Causa:  Publish directory mal configurado
Solución: Debe ser "public", NO "server"
```

---

## 🎯 Migrate desde Express (lo que se hizo)

### Antes (Express)
```
server/app.js         ← Servidor persistente corriendo
server/database.js    ← Conexión a MongoDB
server/package.json   ← Dependencias del servidor
```

### Ahora (Netlify Functions)
```
netlify/functions/groups.js    ← Function para grupos
netlify/functions/users.js     ← Function para usuarios
netlify/functions/gifts.js     ← Function para regalos
netlify/functions/db.js        ← Compartido: conexión MongoDB
netlify/functions/utils.js     ← Compartido: helpers
package.json (raíz)            ← Dependencias para functions
```

---

## 📚 Documentación Relacionada

- `NETLIFY_SETUP.md` - Configuración en dashboard de Netlify
- `README.md` - Documentación general del proyecto
- `QUICK_START.md` - Guía rápida
- `TESTING_LOCAL.md` - Testing con Docker

---

## ✨ Conclusión

Con Netlify Functions tienes:
1. ✅ App funcionando en FREE TIER
2. ✅ Cero costos de infraestructura
3. ✅ Escalabilidad automática
4. ✅ Sin mantenimiento de servidor
5. ✅ MongoDB Atlas gratis

**¡Perfecto para un MVP o demostración!**
