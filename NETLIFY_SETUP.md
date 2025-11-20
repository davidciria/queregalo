# Configuración Exacta de Netlify - QueRegalo

Este documento tiene los pasos EXACTOS para que funcione en Netlify.

## 1️⃣ Build Settings (CRÍTICO)

Ve a: **Site settings → Build & deploy → Build settings**

### Build Command
```
cd server && npm install
```
✅ SIN `npm start` - Netlify lo ejecuta automáticamente desde el Procfile

### Publish Directory
```
public
```
✅ NO `server` - Los archivos servidos son del frontend

### Functions Directory
```
netlify/functions
```
✅ Puede estar vacío, pero déjalo configurado

---

## 2️⃣ Environment Variables (MUY IMPORTANTE)

Ve a: **Site settings → Build & deploy → Environment**

Agrega estas variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://davidciria:EDMRz7TC0yvnEoFJ@cluster0.un0qufd.mongodb.net/?appName=Cluster0` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

✅ Guarda después de cada variable

---

## 3️⃣ Verificar Procfile

En tu repositorio debe existir `/Procfile`:

```
web: npm start --prefix server
```

✅ Este archivo le dice a Netlify cómo ejecutar tu app

---

## 4️⃣ Verificar package.json del server

Abre `/server/package.json`:

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

✅ El script `start` debe ejecutar `node app.js`

---

## 5️⃣ Desplegar

Una vez configurado:

1. Git push a tu rama (si no está linked, linkea el repo)
2. Netlify automáticamente detecta cambios
3. Inicia el build
4. Si es correcta la config, debería funcionar

---

## 🔍 Troubleshooting

### Error: "Function 'server' not found"
**Causa**: Publish directory mal configurado
**Solución**: Cambia a `public`, NO `server`

### Error: "Cannot find module 'mongodb'"
**Causa**: Las dependencias no se instalaron
**Solución**: Verifica que `cd server && npm install` se ejecutó en los logs

### Error: "Connection refused" en MongoDB
**Causa**: `MONGODB_URI` no configurada
**Solución**: Verifica que está en Environment variables

### 404 en archivos estáticos
**Causa**: Netlify no está sirviendo `/public`
**Solución**: Publish directory debe ser `public`, y Express sirve desde ahí

### El sitio carga pero los API calls dan error
**Causa**: Probablemente CORS o MongoDB no conectado
**Solución**: 
- Verifica logs: **Deploy log → Build log → Latest deploy**
- Busca errores de MongoDB
- Verifica que `MONGODB_URI` tiene credenciales correctas

---

## 📋 Checklist Final

- [ ] Build command: `cd server && npm install`
- [ ] Publish directory: `public`
- [ ] Environment variable: `MONGODB_URI` configurada
- [ ] Environment variable: `NODE_ENV` = `production`
- [ ] Procfile existe en raíz del repo
- [ ] package.json en `/server` tiene script `start`
- [ ] `.env` NO está committeado (está en .gitignore)
- [ ] Rama `netlify-deployment` está actualizada en GitHub

---

## 🚀 Una vez funciona

La app debería:
1. Cargar el frontend en `/public`
2. Los endpoint `/api/*` ir a Express
3. Express conectar a MongoDB Atlas
4. Crear grupos, usuarios, regalos
5. Los datos persistir en MongoDB

¡Listo! 🎉
