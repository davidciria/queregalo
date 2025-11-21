// Standalone API function para Netlify - sin dependencias en otros archivos
const { MongoClient, ServerApiVersion } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'queregalo';

let cachedClient = null;
let cachedDb = null;

// ==================== VALIDATION HELPERS ====================
function isString(value) {
  return typeof value === 'string' && value !== '';
}

function isValidInteger(value) {
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num) && num > 0;
}

function isValidPrice(value) {
  return isValidInteger(value);
}

function validateGroupName(name) {
  if (!isString(name)) {
    return { valid: false, error: 'El nombre del grupo debe ser un texto no vacío' };
  }
  if (name.length < 2) {
    return { valid: false, error: 'El nombre del grupo debe tener al menos 2 caracteres' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'El nombre del grupo no puede exceder 100 caracteres' };
  }
  return { valid: true };
}

function validateUserName(name) {
  if (!isString(name)) {
    return { valid: false, error: 'El nombre del usuario debe ser un texto no vacío' };
  }
  if (name.length < 2) {
    return { valid: false, error: 'El nombre del usuario debe tener al menos 2 caracteres' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'El nombre del usuario no puede exceder 100 caracteres' };
  }
  return { valid: true };
}

function validateGiftName(name) {
  if (!isString(name)) {
    return { valid: false, error: 'El nombre del regalo debe ser un texto no vacío' };
  }
  if (name.length < 2) {
    return { valid: false, error: 'El nombre del regalo debe tener al menos 2 caracteres' };
  }
  if (name.length > 200) {
    return { valid: false, error: 'El nombre del regalo no puede exceder 200 caracteres' };
  }
  return { valid: true };
}

function validateGiftPrice(price) {
  if (!isValidPrice(price)) {
    return { valid: false, error: 'El precio debe ser un número entero positivo (ejemplo: 50, no 50€)' };
  }
  if (price > 100000) {
    return { valid: false, error: 'El precio no puede ser mayor a 100000' };
  }
  return { valid: true };
}

function validateGiftLocation(location) {
  if (!isString(location)) {
    return { valid: false, error: 'La ubicación del regalo debe ser un texto no vacío' };
  }
  if (location.length < 2) {
    return { valid: false, error: 'La ubicación debe tener al menos 2 caracteres' };
  }
  if (location.length > 500) {
    return { valid: false, error: 'La ubicación no puede exceder 500 caracteres' };
  }
  return { valid: true };
}

// ==================== HELPERS ====================
function generateSecureGroupId() {
  const uuid = uuidv4().replace(/-/g, '');
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const groupId = (uuid.substring(0, 8) + timestamp + randomPart).toLowerCase();
  return groupId;
}

function generateUserId() {
  return uuidv4().substring(0, 8);
}

function generateGiftId() {
  return uuidv4().substring(0, 8);
}

function sendResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

function sendError(statusCode, message) {
  return sendResponse(statusCode, { error: message });
}

// ==================== DATABASE ====================
async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  try {
    // Opciones MongoDB para conectar a Atlas desde Netlify
    // autoSelectFamily: false evita problemas de TLS en algunas arquitecturas
    // tlsAllowInvalidCertificates: true permite conexiones sin validar certificados
    const client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      autoSelectFamily: false,
      tlsAllowInvalidCertificates: true,
      retryWrites: false,
      maxPoolSize: 1,
      socketTimeoutMS: 5000,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    await client.connect();
    cachedClient = client;
    cachedDb = client.db(DB_NAME);
    return cachedDb;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    throw error;
  }
}

let collectionsCreated = false;

async function ensureCollections(db) {
  if (collectionsCreated) return;

  try {
    await db.collection('groups').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ group_id: 1, name: 1 }, { unique: true });
    await db.collection('gifts').createIndex({ id: 1 }, { unique: true });
    await db.collection('gifts').createIndex({ user_id: 1 });
    collectionsCreated = true;
  } catch (error) {
    // Índices ya existen, es normal
  }
}

// ==================== MAIN HANDLER ====================
exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return sendResponse(200, {});
  }

  try {
    const db = await connectToDatabase();
    await ensureCollections(db);

    const method = event.httpMethod;
    // Extraer ruta sin el prefijo de la función
    const path = event.path.replace(/^\/.netlify\/functions\/api/, '');

    // ============ GROUPS ============
    // POST /api/groups - Crear grupo
    if (method === 'POST' && path === '/api/groups') {
      const { name } = JSON.parse(event.body || '{}');

      const validation = validateGroupName(name);
      if (!validation.valid) {
        return sendError(400, validation.error);
      }

      const groupId = generateSecureGroupId();
      await db.collection('groups').insertOne({
        id: groupId,
        name,
        created_at: new Date(),
      });
      return sendResponse(200, { groupId, name });
    }

    // GET /api/groups/:groupId - Obtener grupo
    const groupMatch = path.match(/^\/api\/groups\/([^/]+)$/);
    if (method === 'GET' && groupMatch) {
      const groupId = groupMatch[1];
      const group = await db.collection('groups').findOne({ id: groupId });
      if (!group) return sendError(404, 'Grupo no encontrado');
      return sendResponse(200, group);
    }

    // ============ USERS ============
    // POST /api/groups/:groupId/users - Crear/obtener usuario
    const createUserMatch = path.match(/^\/api\/groups\/([^/]+)\/users$/);
    if (method === 'POST' && createUserMatch) {
      const groupId = createUserMatch[1];
      const { name } = JSON.parse(event.body || '{}');

      const validation = validateUserName(name);
      if (!validation.valid) {
        return sendError(400, validation.error);
      }

      const group = await db.collection('groups').findOne({ id: groupId });
      if (!group) return sendError(404, 'El grupo no existe');

      let user = await db.collection('users').findOne({ group_id: groupId, name });
      if (user) {
        return sendResponse(200, { userId: user.id, groupId, name });
      }

      const userId = generateUserId();
      await db.collection('users').insertOne({
        id: userId,
        group_id: groupId,
        name,
        created_at: new Date(),
      });

      return sendResponse(200, { userId, groupId, name });
    }

    // GET /api/groups/:groupId/users - Listar usuarios
    const listUsersMatch = path.match(/^\/api\/groups\/([^/]+)\/users$/);
    if (method === 'GET' && listUsersMatch) {
      const groupId = listUsersMatch[1];
      const users = await db
        .collection('users')
        .find({ group_id: groupId })
        .project({ id: 1, name: 1 })
        .toArray();
      return sendResponse(200, users || []);
    }

    // ============ GIFTS ============
    // POST /api/groups/:groupId/users/:userId/gifts - Crear regalo
    const createGiftMatch = path.match(/^\/api\/groups\/([^/]+)\/users\/([^/]+)\/gifts$/);
    if (method === 'POST' && createGiftMatch) {
      const groupId = createGiftMatch[1];
      const userId = createGiftMatch[2];
      const { name, price, location } = JSON.parse(event.body || '{}');

      // Validar que todos los campos estén presentes
      if (name === undefined || price === undefined || location === undefined) {
        return sendError(400, 'Los campos nombre, precio y ubicación son requeridos');
      }

      // Validar cada campo
      const nameValidation = validateGiftName(name);
      if (!nameValidation.valid) {
        return sendError(400, nameValidation.error);
      }

      const priceValidation = validateGiftPrice(price);
      if (!priceValidation.valid) {
        return sendError(400, priceValidation.error);
      }

      const locationValidation = validateGiftLocation(location);
      if (!locationValidation.valid) {
        return sendError(400, locationValidation.error);
      }

      // Validar que el grupo exista
      const group = await db.collection('groups').findOne({ id: groupId });
      if (!group) return sendError(404, 'El grupo no existe');

      // Validar que el usuario exista
      const user = await db.collection('users').findOne({ id: userId });
      if (!user || user.group_id !== groupId) return sendError(404, 'El usuario no existe en este grupo');

      const giftId = generateGiftId();
      const priceAsInt = parseInt(price, 10);

      await db.collection('gifts').insertOne({
        id: giftId,
        user_id: userId,
        name,
        price: priceAsInt,
        location,
        locked_by: null,
        created_at: new Date(),
      });

      return sendResponse(200, { giftId, userId, name, price: priceAsInt, location, locked_by: null });
    }

    // GET /api/groups/:groupId/users/:userId/gifts - Regalos de un usuario
    const userGiftsMatch = path.match(/^\/api\/groups\/([^/]+)\/users\/([^/]+)\/gifts$/);
    if (method === 'GET' && userGiftsMatch) {
      const userId = userGiftsMatch[2];
      const gifts = await db.collection('gifts').find({ user_id: userId }).toArray();
      return sendResponse(200, gifts || []);
    }

    // GET /api/groups/:groupId/gifts - Todos los regalos del grupo
    const allGiftsMatch = path.match(/^\/api\/groups\/([^/]+)\/gifts$/);
    if (method === 'GET' && allGiftsMatch) {
      const groupId = allGiftsMatch[1];

      const gifts = await db
        .collection('gifts')
        .aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: 'id',
              as: 'user_info',
            },
          },
          {
            $unwind: '$user_info',
          },
          {
            $match: {
              'user_info.group_id': groupId,
            },
          },
          {
            $addFields: {
              user_name: '$user_info.name',
            },
          },
          {
            $project: {
              user_info: 0,
            },
          },
        ])
        .toArray();

      return sendResponse(200, gifts || []);
    }

    // PUT /api/gifts/:giftId/lock - Bloquear regalo
    const lockMatch = path.match(/^\/api\/gifts\/([^/]+)\/lock$/);
    if (method === 'PUT' && lockMatch) {
      const giftId = lockMatch[1];
      const { lockedBy } = JSON.parse(event.body || '{}');

      if (!isString(lockedBy)) return sendError(400, 'El ID del usuario que bloquea es requerido');

      const gift = await db.collection('gifts').findOne({ id: giftId });

      if (!gift) return sendError(404, 'Regalo no encontrado');

      // Validar que el usuario que bloquea existe
      const user = await db.collection('users').findOne({ id: lockedBy });
      if (!user) return sendError(404, 'El usuario no existe');

      if (gift.locked_by && gift.locked_by !== lockedBy) {
        return sendError(409, 'Este regalo ya fue asignado a otro usuario');
      }

      if (gift.locked_by === lockedBy) {
        return sendResponse(200, { success: true });
      }

      const result = await db.collection('gifts').updateOne(
        { id: giftId, locked_by: null },
        { $set: { locked_by: lockedBy } }
      );

      if (result.matchedCount === 0) {
        return sendError(409, 'Este regalo ya fue asignado a otro usuario');
      }

      return sendResponse(200, { success: true });
    }

    // PUT /api/gifts/:giftId/unlock - Desbloquear regalo
    const unlockMatch = path.match(/^\/api\/gifts\/([^/]+)\/unlock$/);
    if (method === 'PUT' && unlockMatch) {
      const giftId = unlockMatch[1];
      const { unlockedBy } = JSON.parse(event.body || '{}');

      if (!isString(unlockedBy)) return sendError(400, 'El ID del usuario que desbloquea es requerido');

      const gift = await db.collection('gifts').findOne({ id: giftId });

      if (!gift) return sendError(404, 'Regalo no encontrado');

      if (!gift.locked_by) {
        return sendResponse(200, { success: true });
      }

      if (unlockedBy && gift.locked_by !== unlockedBy) {
        return sendError(403, 'Solo quien bloqueó el regalo puede desbloquearlo');
      }

      await db.collection('gifts').updateOne(
        { id: giftId },
        { $set: { locked_by: null } }
      );

      return sendResponse(200, { success: true });
    }

    // DELETE /api/gifts/:giftId - Eliminar regalo
    const deleteMatch = path.match(/^\/api\/gifts\/([^/]+)$/);
    if (method === 'DELETE' && deleteMatch) {
      const giftId = deleteMatch[1];
      await db.collection('gifts').deleteOne({ id: giftId });
      return sendResponse(200, { success: true });
    }

    return sendError(404, `Endpoint no encontrado: ${method} ${path}`);
  } catch (error) {
    console.error('❌ API Error:', error);
    return sendError(500, error.message || 'Error interno del servidor');
  }
};
