# 🎁 QueRegalo - Aplicación de Listas de Regalos Compartidas

Una aplicación web responsive para que grupos de personas compartan sus listas de regalos de forma privada y segura.

## Características

- ✅ Crear grupos con nombres únicos
- ✅ Compartir grupos con enlace único
- ✅ Cada usuario gestiona su lista de regalos
- ✅ Ver regalos de otros usuarios del grupo
- ✅ Bloquear regalos para indicar que los vas a comprar (secreto para el propietario)
- ✅ Interface responsive para móviles y escritorio
- ✅ Base de datos SQLite persistente con Docker
- ✅ 100% PWA compatible

## Requisitos

- Docker y Docker Compose

## Instalación y Ejecución

### Con Docker (Recomendado)

```bash
cd /home/orangepi/queregalo

# Construir e iniciar los contenedores
docker-compose up --build

# La aplicación estará disponible en http://localhost:3000
```

### Sin Docker (Desarrollo local)

```bash
# Instalar dependencias
cd server
npm install
cd ..

# Iniciar el servidor
cd server
npm start

# En otra terminal, puedes servir los archivos públicos
# Por defecto se sirven desde http://localhost:3000
```

## Cómo Usar

### Para el Creador del Grupo

1. Abre la aplicación en http://localhost:3000
2. Haz clic en "Crear un nuevo grupo"
3. Ingresa el nombre del grupo (Ej: "Navidad 2024")
4. Copia el enlace único que se genera
5. Comparte el enlace con las personas del grupo
6. Ingresa tu nombre para crear tu usuario
7. Añade tus regalos indicando:
   - Nombre del regalo
   - Precio aproximado
   - Dónde encontrarlo (URL o descripción de tienda)

### Para los Participantes

1. Abre el enlace que compartió el creador del grupo
2. Selecciona tu nombre o crea uno nuevo
3. Añade tus regalos
4. Ve los regalos de otros participantes
5. Si quieres comprar un regalo de alguien, haz clic en "Quiero regalarlo"
6. El regalo se bloqueará y solo tú sabrás que lo estás comprando
7. La persona que recibe el regalo verá que está bloqueado pero no sabrá quién lo compra

## Estructura del Proyecto

```
queregalo/
├── server/
│   ├── app.js           # Servidor Express y endpoints API
│   ├── database.js      # Configuración de SQLite
│   └── package.json     # Dependencias del servidor
├── public/
│   ├── index.html       # HTML principal
│   ├── app.js          # Lógica de la aplicación frontend
│   └── styles.css      # Estilos responsive
├── Dockerfile          # Configuración del contenedor
├── docker-compose.yml  # Orquestación de servicios
└── README.md          # Este archivo
```

## API Endpoints

### Grupos
- `POST /api/groups` - Crear nuevo grupo
- `GET /api/groups/:groupId` - Obtener información del grupo

### Usuarios
- `POST /api/groups/:groupId/users` - Crear o seleccionar usuario
- `GET /api/groups/:groupId/users` - Obtener usuarios del grupo

### Regalos
- `POST /api/groups/:groupId/users/:userId/gifts` - Añadir regalo
- `GET /api/groups/:groupId/users/:userId/gifts` - Obtener regalos del usuario
- `GET /api/groups/:groupId/gifts` - Obtener todos los regalos del grupo
- `PUT /api/gifts/:giftId/lock` - Bloquear un regalo
- `PUT /api/gifts/:giftId/unlock` - Desbloquear un regalo
- `DELETE /api/gifts/:giftId` - Eliminar un regalo

## Base de Datos

La aplicación utiliza SQLite con las siguientes tablas:

### groups
- `id`: Identificador único (8 caracteres)
- `name`: Nombre del grupo
- `created_at`: Timestamp de creación

### users
- `id`: Identificador único (8 caracteres)
- `group_id`: Referencia al grupo
- `name`: Nombre del usuario
- `created_at`: Timestamp de creación

### gifts
- `id`: Identificador único (8 caracteres)
- `user_id`: Referencia al usuario propietario
- `name`: Nombre del regalo
- `price`: Precio aproximado
- `location`: Dónde encontrarlo
- `locked_by`: ID del usuario que lo bloqueó (NULL si no está bloqueado)
- `created_at`: Timestamp de creación

## Persistencia de Datos

Con Docker, los datos se guardan en un volumen persistente (`queregalo-data`). Esto significa que:

- Los datos persisten incluso si detienes o eliminas el contenedor
- Puedes hacer backup del volumen
- Los datos están seguros en caso de reinicio del sistema

## Personalización

### Cambiar el Puerto

Edita `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Cambia el primer número al puerto que desees
```

### Variables de Entorno

Puedes añadir variables en `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

## Troubleshooting

### La aplicación no inicia
1. Verifica que Docker y Docker Compose estén instalados
2. Comprueba que el puerto 3000 no esté en uso
3. Revisa los logs: `docker-compose logs -f`

### No se guardan los datos
1. Verifica que el volumen existe: `docker volume ls`
2. Comprueba que el contenedor tiene permisos de escritura

### Errores de conexión
1. Asegúrate de usar `http://localhost:3000` (no https)
2. Limpia el caché del navegador
3. Abre las herramientas de desarrollador (F12) para ver errores

## Licencia

Libre para usar y modificar

## Soporte

Para reportar bugs o sugerencias, crea un issue o contacta al desarrollador.
