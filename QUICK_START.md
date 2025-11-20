# Guía Rápida de Despliegue - QueRegalo

## Despliegue en Netlify (5 minutos)

### Paso 1: Variables de Entorno
Tu MongoDB URI ya está configurada:
```
mongodb+srv://thedacima99_db_user:rMVdW2ZqcvV3fMyV@queregalo.aa9hovk.mongodb.net/?appName=QueRegalo
```

### Paso 2: Conectar a Netlify

```bash
# Desde línea de comandos (optional)
npm install -g netlify-cli
netlify deploy
```

O manualmente en https://app.netlify.com:

1. Click "New site from Git"
2. Select GitHub
3. Selecciona `davidciria/queregalo`
4. Rama: `netlify-deployment`
5. Build command: `cd server && npm install`
6. Publish: `public`

### Paso 3: Agregar Variable de Entorno en Netlify

En el dashboard de Netlify:
1. Site settings → Build & deploy → Environment
2. Add environment variable:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://thedacima99_db_user:rMVdW2ZqcvV3fMyV@queregalo.aa9hovk.mongodb.net/?appName=QueRegalo`

### Paso 4: Deploy

Click "Deploy" y espera ~2-3 minutos.

## Desarrollo Local

### Instalación

```bash
cd server
npm install
cp ../.env.example ../.env
npm start
```

Abre http://localhost:3000

### Test Rápido

```bash
# Crear grupo
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# Debería retornar:
# {"groupId":"...", "name":"Test"}
```

## Verificar Despliegue

Una vez en Netlify, verifica que funciona:

1. Abre tu sitio (ej: `https://queregalo-app.netlify.app`)
2. Crea un grupo
3. Copia el enlace
4. Abre en otra pestaña/dispositivo
5. Verifica que ves los mismos datos

## MongoDB - Verificar Datos

https://cloud.mongodb.com → Clusters → Browse Collections

Debería ver:
- Colección `groups`
- Colección `users`
- Colección `gifts`

## Problemas Comunes

| Problema | Solución |
|----------|----------|
| Error conectando a MongoDB | Verifica MONGODB_URI en variables de Netlify |
| 404 en /api endpoints | Comprueba que netlify.toml existe |
| Datos no persisten | MongoDB no está conectado (revisar logs de Netlify) |
| Page refreshes dan 404 | netlify.toml debería redirigir a /index.html |

## Logs de Netlify

Para ver errores:
1. Netlify Dashboard → your-site
2. Logs → Deploy logs
3. Busca errores de MongoDB o Node

## Siguientes Pasos

- Compartir el enlace con amigos
- Probar crear grupos y regalos
- Verificar sincronización entre dispositivos
- Monitorear MongoDB en https://cloud.mongodb.com

¡Listo! Tu app está en producción.
