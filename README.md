# QueRegalo - Gift Wishlist Sharing App

Una aplicación web para compartir listas de deseos con grupos de amigos y familiares. Permite crear grupos, añadir regalos y "bloquear" regalos que piensas regalar (como sorpresa).

## Features

✅ **Gestión de Grupos** - Crea grupos con enlace compartible
✅ **Listas de Regalos** - Cada usuario añade sus regalos deseados
✅ **Bloqueo de Regalos** - "Bloquea" un regalo cuando planeas regalarlo (sorpresa)
✅ **Persistencia Cloud** - Los datos se guardan en MongoDB Atlas
✅ **Multi-dispositivo** - Accede desde diferentes dispositivos con el mismo enlace
✅ **Responsive** - Totalmente optimizado para móvil
✅ **Seguro** - IDs de grupo imposibles de adivinar

## Stack Tecnológico

- **Frontend**: HTML + CSS + Vanilla JavaScript
- **Backend**: Express.js (Node.js)
- **Base de Datos**: MongoDB Atlas (Cloud)
- **Hosting**: Netlify

## Instalación Local

### Requisitos

- Node.js 14+
- MongoDB Atlas cluster (cuenta gratuita)

### Pasos

1. **Clonar repositorio**
```bash
git clone https://github.com/davidciria/queregalo.git
cd queregalo
```

2. **Crear archivo .env**
```bash
cp .env.example .env
```

3. **Configurar MongoDB URI en .env**
```bash
# .env
MONGODB_URI=tu_mongodb_connection_string
PORT=3000
NODE_ENV=development
```

4. **Instalar dependencias**
```bash
cd server
npm install
```

5. **Iniciar servidor**
```bash
npm start
```

6. **Acceder a la app**
```
http://localhost:3000
```

## Desarrollo

### Estructura del Proyecto

```
queregalo/
├── public/              # Frontend estático
│   ├── index.html      # SPA principal
│   ├── app.js          # Lógica de la app (vanilla JS)
│   └── styles.css      # Estilos responsive
├── server/             # Backend Express
│   ├── app.js          # API endpoints
│   ├── database.js     # Configuración MongoDB
│   └── package.json    # Dependencias
├── .env.example        # Variables de entorno ejemplo
├── netlify.toml        # Configuración Netlify
└── Procfile            # Comando para ejecutar en Netlify
```

### Endpoints API

**Grupos**
- `POST /api/groups` - Crear grupo
- `GET /api/groups/:groupId` - Obtener grupo

**Usuarios**
- `POST /api/groups/:groupId/users` - Crear usuario
- `GET /api/groups/:groupId/users` - Listar usuarios

**Regalos**
- `POST /api/groups/:groupId/users/:userId/gifts` - Crear regalo
- `GET /api/groups/:groupId/gifts` - Obtener todos los regalos
- `PUT /api/gifts/:giftId/lock` - Bloquear regalo
- `PUT /api/gifts/:giftId/unlock` - Desbloquear regalo
- `DELETE /api/gifts/:giftId` - Eliminar regalo

## Despliegue

### Opción 1: Netlify (Recomendado)

Ver [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) para instrucciones detalladas.

**Requisitos:**
- Cuenta Netlify (gratis)
- MongoDB Atlas (gratis)

**Pasos rápidos:**
1. Conecta tu repositorio a Netlify
2. Selecciona rama `netlify-deployment`
3. Añade variable de entorno `MONGODB_URI` en Netlify
4. Deploy automático

### Opción 2: Heroku (Alternativa)

```bash
heroku create
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main
```

## Cómo Usar la App

### Para el Propietario del Grupo

1. **Crear grupo** - Haz clic en "Crear Grupo" con tu nombre
2. **Compartir enlace** - Copia el enlace y comparte con otros
3. **Añadir regalos** - Haz clic en "Añadir regalo" y completa:
   - Nombre del regalo
   - Precio aproximado
   - Dónde lo venden (Amazon, tienda física, etc.)
4. **Ver qué regalos quieren otros** - Los regalos bloqueados no te los muestra

### Para Otros Participantes

1. **Acceder al enlace del grupo** - El propietario te envía el enlace
2. **Seleccionar tu nombre** o registrarse nuevo
3. **Ver listas de otros** - "Regalos de tus amigos"
4. **Bloquear regalo** - "Quiero regalarlo" = sorpresa confirmada
5. **Cambiar de opinión** - "Desbloquear" si cambias de idea

## Características Técnicas

### Seguridad

- **IDs de Grupo Seguros** - Combinación de UUID + timestamp + números aleatorios
- **Race Condition Protection** - SQL queries atómicas para evitar doble bloqueo
- **HTTPS en Netlify** - Encriptación en tránsito automática
- **No almacena contraseñas** - Sistema anónimo por defecto

### Persistencia

- **MongoDB Atlas** - Los datos persisten en la nube
- **Sincronización** - Múltiples dispositivos ven los mismos datos
- **Sin límite de tiempo** - Los datos no expiran
- **Backups automáticos** - MongoDB Atlas hace backups diarios

### Performance

- **SPA Frontend** - Cambios instantáneos sin recargar página
- **API Endpoints** - Respuestas rápidas de la BD
- **Lazy Loading** - Scroll suave incluso con muchos regalos
- **Mobile First** - Optimizado para smartphones

## Troubleshooting

**Problema**: No puedo acceder a la app
- Solución: Verifica que el servidor está corriendo (`npm start` en carpeta `server`)

**Problema**: Los datos no se guardan
- Solución: Comprueba que `MONGODB_URI` es correcta y MongoDB está disponible

**Problema**: El regalo se bloquea pero sigue visible
- Comportamiento correcto: El propietario nunca ve qué regalos están bloqueados

**Problema**: El enlace no funciona en otro dispositivo
- Solución: Copia exactamente el enlace con los parámetros `?group=` y `?user=`

## Roadmap

- [ ] Autenticación con cuentas
- [ ] Fotos de regalos
- [ ] Notificaciones cuando alguien bloquea un regalo
- [ ] Historial de regalos regalados
- [ ] Integración con Amazon Wishlist

## Contribuir

¿Encontraste un bug o tienes una idea? Abre un issue en [GitHub Issues](https://github.com/davidciria/queregalo/issues)

## Licencia

MIT

## Autor

Creado por [David Ciria](https://github.com/davidciria)

## Soporte

Para preguntas o problemas, abre un issue en GitHub.
