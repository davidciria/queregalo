const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../public')));

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
app.post('/api/groups', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre del grupo es requerido' });
  }

  const groupId = generateSecureGroupId();
  db.run('INSERT INTO groups (id, name) VALUES (?, ?)', [groupId, name], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al crear el grupo' });
    }
    res.json({ groupId, name });
  });
});

// Obtener información del grupo
app.get('/api/groups/:groupId', (req, res) => {
  const { groupId } = req.params;
  db.get('SELECT * FROM groups WHERE id = ?', [groupId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener el grupo' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.json(row);
  });
});

// ENDPOINTS DE USUARIOS
// Crear o obtener usuario en un grupo
app.post('/api/groups/:groupId/users', (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre del usuario es requerido' });
  }

  // Verificar que el grupo existe
  db.get('SELECT id FROM groups WHERE id = ?', [groupId], (err, group) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar el grupo' });
    }
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Verificar si el usuario ya existe en el grupo
    db.get(
      'SELECT id FROM users WHERE group_id = ? AND name = ?',
      [groupId, name],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar usuario' });
        }

        if (user) {
          // El usuario ya existe
          res.json({ userId: user.id, groupId, name });
        } else {
          // Crear nuevo usuario
          const userId = uuidv4().substring(0, 8);
          db.run(
            'INSERT INTO users (id, group_id, name) VALUES (?, ?, ?)',
            [userId, groupId, name],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Error al crear usuario' });
              }
              res.json({ userId, groupId, name });
            }
          );
        }
      }
    );
  });
});

// Obtener usuarios de un grupo
app.get('/api/groups/:groupId/users', (req, res) => {
  const { groupId } = req.params;
  db.all('SELECT id, name FROM users WHERE group_id = ?', [groupId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    res.json(rows || []);
  });
});

// ENDPOINTS DE REGALOS
// Añadir regalo
app.post('/api/groups/:groupId/users/:userId/gifts', (req, res) => {
  const { groupId, userId } = req.params;
  const { name, price, location } = req.body;

  if (!name || !price || !location) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const giftId = uuidv4().substring(0, 8);
  db.run(
    'INSERT INTO gifts (id, user_id, name, price, location) VALUES (?, ?, ?, ?, ?)',
    [giftId, userId, name, price, location],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al crear regalo' });
      }
      res.json({ giftId, userId, name, price, location, locked_by: null });
    }
  );
});

// Obtener regalos de un usuario
app.get('/api/groups/:groupId/users/:userId/gifts', (req, res) => {
  const { userId } = req.params;
  db.all('SELECT * FROM gifts WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener regalos' });
    }
    res.json(rows || []);
  });
});

// Obtener todos los regalos de un grupo (para ver los de otros)
app.get('/api/groups/:groupId/gifts', (req, res) => {
  const { groupId } = req.params;
  db.all(
    `SELECT g.*, u.name as user_name
     FROM gifts g
     JOIN users u ON g.user_id = u.id
     WHERE u.group_id = ?`,
    [groupId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener regalos' });
      }
      res.json(rows || []);
    }
  );
});

// Bloquear un regalo
app.put('/api/gifts/:giftId/lock', (req, res) => {
  const { giftId } = req.params;
  const { lockedBy } = req.body;

  if (!lockedBy) {
    return res.status(400).json({ error: 'El ID del usuario que bloquea es requerido' });
  }

  // Primero verificar si el regalo ya está bloqueado (evitar race conditions)
  db.get('SELECT locked_by FROM gifts WHERE id = ?', [giftId], (err, gift) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar regalo' });
    }

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

    // Bloquear el regalo
    db.run(
      'UPDATE gifts SET locked_by = ? WHERE id = ? AND locked_by IS NULL',
      [lockedBy, giftId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error al bloquear regalo' });
        }

        // Verificar si la actualización fue exitosa
        if (this.changes === 0) {
          return res.status(409).json({ error: 'Este regalo ya fue asignado a otro usuario' });
        }

        res.json({ success: true });
      }
    );
  });
});

// Desbloquear un regalo
app.put('/api/gifts/:giftId/unlock', (req, res) => {
  const { giftId } = req.params;
  const { unlockedBy } = req.body;

  // Primero verificar que quien intenta desbloquear es quien lo bloqueó
  db.get('SELECT locked_by FROM gifts WHERE id = ?', [giftId], (err, gift) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar regalo' });
    }

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
    db.run('UPDATE gifts SET locked_by = NULL WHERE id = ?', [giftId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al desbloquear regalo' });
      }
      res.json({ success: true });
    });
  });
});

// Eliminar regalo
app.delete('/api/gifts/:giftId', (req, res) => {
  const { giftId } = req.params;
  db.run('DELETE FROM gifts WHERE id = ?', [giftId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar regalo' });
    }
    res.json({ success: true });
  });
});

// Servir el index.html para rutas no definidas (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar base de datos y iniciar servidor
db.init(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
});

module.exports = app;
