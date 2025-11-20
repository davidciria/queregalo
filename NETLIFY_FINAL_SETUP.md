# QueRegalo - Configuración Final para Netlify (Free Tier)

## ✅ Cambio de Arquitectura

Tu app ha sido **completamente refactorizada** para funcionar en **Netlify Free Tier** usando **Netlify Functions** (serverless lambdas) en lugar de un servidor Express persistente.

---

## 🔄 Qué Cambió

**Antes (No funciona en Free Tier):**
```
Express server corriendo 24/7 → MongoDB Atlas
```

**Ahora (Funciona perfectamente en Free Tier):**
```
Netlify Functions (serverless) → MongoDB Atlas
```

---

## 🚀 Pasos para Configurar en Netlify Dashboard

### Paso 1: Verificar Build Settings

Ve a: **Your Site → Site settings → Build & deploy → Build settings**

Verifica que tengas:

```
Build command:        npm install
Publish directory:    public
Functions directory:  netlify/functions
```

⚠️ **Importante**: NO es `cd server && npm install` - Cambió a solo `npm install`

### Paso 2: Verificar Environment Variables

Ve a: **Site settings → Build & deploy → Environment**

Asegúrate de tener estas variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://davidciria:...@cluster0...` |
| `NODE_ENV` | `production` |

✅ Guarda después de agregar cada una

### Paso 3: Trigger Deploy

Una vez configurado:

1. Git push a rama `netlify-deployment`
2. Netlify automáticamente detecta cambios
3. Inicia el build (5-10 segundos)
4. Deploy automático

---

## 🧪 Verificar que Funciona

### 1. Abre tu sitio
```
https://tu-site.netlify.app
```

### 2. Verifica que carga el frontend
- Deberías ver la interfaz de QueRegalo
- Sin errores en consola

### 3. Crea un grupo
- Click "Crear Grupo"
- Ingresa nombre
- Debería crear y guardar en MongoDB

### 4. Verifica en MongoDB
```bash
# Desde tu terminal (local)
mongosh "mongodb+srv://davidciria:...@cluster0..."

# En el shell:
> use queregalo
> db.groups.find()  # Debería mostrar tu grupo
```

### 5. Prueba crear usuarios y regalos
- Todo debería funcionar normalmente
- Los datos persisten en MongoDB

---

## 🔍 Si Hay Errores

### Error: "404 Not Found" en API calls

**Causa**: Netlify Functions no encontradas
**Solución**: 
1. Ve a Deploy log (Site → Deploys)
2. Busca errores en "Build log"
3. Verifica que `netlify/functions/` existe en tu repo

### Error: "Cannot connect to MongoDB"

**Causa**: Variable `MONGODB_URI` no configurada
**Solución**:
1. Site settings → Build & deploy → Environment
2. Agrega `MONGODB_URI` con tu URI real
3. Trigger redeploy

### Error: "Module not found: mongodb"

**Causa**: npm install no ejecutó correctamente
**Solución**:
1. Limpia caché de Netlify: Site → Deploys → Trigger redeploy
2. Verifica que `/package.json` (raíz) tiene `mongodb` en dependencies

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes (Express) | Después (Functions) |
|---------|-----------------|-------------------|
| Servidor | Express corriendo 24/7 | Serverless (sin servidor) |
| Costo | Pago (Heroku, etc.) | Gratis (Netlify Free) |
| Invocaciones | Ilimitadas | 125k/mes (suficiente) |
| Cold start | N/A | ~1s primera vez |
| Setup | Complejo | Automático |
| Mantenimiento | Requiere monitoreo | Cero mantenimiento |

---

## 💡 Beneficios Reales

✅ **Completamente gratis** - $0/mes
✅ **Escalable automáticamente** - Si crece, Netlify escala
✅ **Sin mantenimiento** - Netlify gestiona todo
✅ **Rápido** - CDN global de Netlify
✅ **Seguro** - SSL/HTTPS automático
✅ **Perfect para MVP** - Ideal para demostración

---

## 📁 Archivos Nuevos

```
netlify/functions/
├── groups.js        # GET/POST /api/groups
├── users.js         # GET/POST /api/groups/:id/users
├── gifts.js         # GET/POST/PUT/DELETE /api/gifts
├── db.js            # MongoDB connection helper
└── utils.js         # ID generation, response helpers

package.json (raíz)  # Dependencies: mongodb, uuid
netlify.toml         # Updated with function redirects
NETLIFY_FUNCTIONS.md # Documentación completa
```

---

## ⚡ Timing Esperado

**Primera request:** ~1-2 segundos (cold start)
**Requests siguientes:** ~100-200ms
**Esto es aceptable para un MVP/demostración**

---

## 🎯 Próximos Pasos

1. ✅ Actualiza Netlify dashboard (Build settings)
2. ✅ Verifica Environment variables
3. ✅ Trigger deploy
4. ✅ Prueba crear grupo
5. ✅ Verifica datos en MongoDB
6. ✅ ¡Listo! Comparte tu sitio con amigos

---

## 📞 Soporte

Si tienes problemas:

1. Verifica Netlify Deploy log (Site → Deploys → Latest)
2. Busca errores de MongoDB (MONGODB_URI configurada?)
3. Verifica que package.json tiene mongodb en dependencies
4. Lee NETLIFY_FUNCTIONS.md para más detalles

---

## ✨ Conclusión

Tu aplicación QueRegalo ahora es:
- ✅ 100% compatible con Netlify Free Tier
- ✅ Completamente serverless (Netlify Functions)
- ✅ Persistencia en MongoDB Atlas (gratis)
- ✅ Cero costos de infraestructura
- ✅ Lista para producción

**¡Felicitaciones! Tu app está lista para desplegar.** 🎉
