const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbModule = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../public')));

// Obtener referencia a la base de datos
let db;

// Función para generar IDs de grupo seguros y difíciles de fuzzear
function generateSecureGroupId() {
  // Generar un ID complejo combinando UUID y caracteres aleatorios
  // Resultado: 16+ caracteres con números, letras minúsculas y mayúsculas
  const uuid = uuidv4().replace(/-/g, '');
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  // Tomar partes del UUID para mayor entropia
  const groupId = (uuid.substring(0, 8) + timestamp + randomPart).toLowerCase();
  return groupId;
}

// ENDPOINTS DE GRUPOS
// Crear un nuevo grupo
app.post('/api/groups', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre del grupo es requerido' });
  }

  try {
    const groupId = generateSecureGroupId();
    await db.collection('groups').insertOne({
      id: groupId,
      name,
      created_at: new Date()
    });
    res.json({ groupId, name });
  } catch (error) {
    console.error('Error al crear el grupo:', error);
    res.status(500).json({ error: 'Error al crear el grupo' });
  }
});

// Obtener información del grupo
app.get('/api/groups/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await db.collection('groups').findOne({ id: groupId });
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error al obtener el grupo:', error);
    res.status(500).json({ error: 'Error al obtener el grupo' });
  }
});

// ENDPOINTS DE USUARIOS
// Crear o obtener usuario en un grupo
app.post('/api/groups/:groupId/users', async (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre del usuario es requerido' });
  }

  try {
    // Verificar que el grupo existe
    const group = await db.collection('groups').findOne({ id: groupId });
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Verificar si el usuario ya existe en el grupo
    let user = await db.collection('users').findOne({ group_id: groupId, name });

    if (user) {
      // El usuario ya existe
      res.json({ userId: user.id, groupId, name });
    } else {
      // Crear nuevo usuario
      const userId = uuidv4().substring(0, 8);
      await db.collection('users').insertOne({
        id: userId,
        group_id: groupId,
        name,
        created_at: new Date()
      });
      res.json({ userId, groupId, name });
    }
  } catch (error) {
    console.error('Error al crear/obtener usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Obtener usuarios de un grupo
app.get('/api/groups/:groupId/users', async (req, res) => {
  const { groupId } = req.params;
  try {
    const users = await db.collection('users')
      .find({ group_id: groupId })
      .project({ id: 1, name: 1 })
      .toArray();
    res.json(users || []);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// ENDPOINTS DE REGALOS
// Añadir regalo
app.post('/api/groups/:groupId/users/:userId/gifts', async (req, res) => {
  const { groupId, userId } = req.params;
  const { name, price, location } = req.body;

  if (!name || !price || !location) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const giftId = uuidv4().substring(0, 8);
    await db.collection('gifts').insertOne({
      id: giftId,
      user_id: userId,
      name,
      price,
      location,
      locked_by: null,
      created_at: new Date()
    });
    res.json({ giftId, userId, name, price, location, locked_by: null });
  } catch (error) {
    console.error('Error al crear regalo:', error);
    res.status(500).json({ error: 'Error al crear regalo' });
  }
});

// Obtener regalos de un usuario
app.get('/api/groups/:groupId/users/:userId/gifts', async (req, res) => {
  const { userId } = req.params;
  try {
    const gifts = await db.collection('gifts')
      .find({ user_id: userId })
      .toArray();
    res.json(gifts || []);
  } catch (error) {
    console.error('Error al obtener regalos:', error);
    res.status(500).json({ error: 'Error al obtener regalos' });
  }
});

// Obtener todos los regalos de un grupo (para ver los de otros)
app.get('/api/groups/:groupId/gifts', async (req, res) => {
  const { groupId } = req.params;
  try {
    // Usar aggregation pipeline para hacer el equivalente de un JOIN
    const gifts = await db.collection('gifts')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: 'id',
            as: 'user_info'
          }
        },
        {
          $unwind: '$user_info'
        },
        {
          $match: {
            'user_info.group_id': groupId
          }
        },
        {
          $addFields: {
            user_name: '$user_info.name'
          }
        },
        {
          $project: {
            user_info: 0
          }
        }
      ])
      .toArray();
    res.json(gifts || []);
  } catch (error) {
    console.error('Error al obtener regalos:', error);
    res.status(500).json({ error: 'Error al obtener regalos' });
  }
});

// Bloquear un regalo
app.put('/api/gifts/:giftId/lock', async (req, res) => {
  const { giftId } = req.params;
  const { lockedBy } = req.body;

  if (!lockedBy) {
    return res.status(400).json({ error: 'El ID del usuario que bloquea es requerido' });
  }

  try {
    // Primero verificar si el regalo ya está bloqueado (evitar race conditions)
    const gift = await db.collection('gifts').findOne({ id: giftId });

    if (!gift) {
      return res.status(404).json({ error: 'Regalo no encontrado' });
    }

    // Si ya está bloqueado por otro, devolver error
    if (gift.locked_by && gift.locked_by !== lockedBy) {
      return res.status(409).json({ error: 'Este regalo ya fue asignado a otro usuario' });
    }

    // Si ya está bloqueado por el mismo usuario, devolver success
    if (gift.locked_by === lockedBy) {
      return res.json({ success: true });
    }

    // Bloquear el regalo (solo si no está bloqueado)
    const result = await db.collection('gifts').updateOne(
      { id: giftId, locked_by: null },
      { $set: { locked_by: lockedBy } }
    );

    // Verificar si la actualización fue exitosa
    if (result.matchedCount === 0) {
      return res.status(409).json({ error: 'Este regalo ya fue asignado a otro usuario' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al bloquear regalo:', error);
    res.status(500).json({ error: 'Error al bloquear regalo' });
  }
});

// Desbloquear un regalo
app.put('/api/gifts/:giftId/unlock', async (req, res) => {
  const { giftId } = req.params;
  const { unlockedBy } = req.body;

  try {
    // Primero verificar que quien intenta desbloquear es quien lo bloqueó
    const gift = await db.collection('gifts').findOne({ id: giftId });

    if (!gift) {
      return res.status(404).json({ error: 'Regalo no encontrado' });
    }

    // Si no está bloqueado, no hay nada que desbloquear
    if (!gift.locked_by) {
      return res.json({ success: true });
    }

    // Solo quien lo bloqueó puede desbloquearlo
    if (unlockedBy && gift.locked_by !== unlockedBy) {
      return res.status(403).json({ error: 'Solo quien bloqueó el regalo puede desbloquearlo' });
    }

    // Desbloquear el regalo
    await db.collection('gifts').updateOne(
      { id: giftId },
      { $set: { locked_by: null } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al desbloquear regalo:', error);
    res.status(500).json({ error: 'Error al desbloquear regalo' });
  }
});

// Eliminar regalo
app.delete('/api/gifts/:giftId', async (req, res) => {
  const { giftId } = req.params;
  try {
    await db.collection('gifts').deleteOne({ id: giftId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar regalo:', error);
    res.status(500).json({ error: 'Error al eliminar regalo' });
  }
});

// Servir el index.html para rutas no definidas (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar MongoDB y iniciar servidor
dbModule.connect()
  .then(() => {
    db = dbModule.getDb();
    return dbModule.init(() => {
      app.listen(PORT, () => {
        console.log(`Servidor escuchando en puerto ${PORT}`);
      });
    });
  })
  .catch((error) => {
    console.error('Error al inicializar la aplicación:', error);
    process.exit(1);
  });

module.exports = app;
