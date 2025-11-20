const { connectToDatabase, ensureCollections } = require('./db');
const { generateSecureGroupId, generateUserId, generateGiftId, sendResponse, sendError } = require('./utils');

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return sendResponse(200, {});
  }

  try {
    const db = await connectToDatabase();
    await ensureCollections(db);

    const method = event.httpMethod;
    const path = event.path;

    // ============ GROUPS ============
    // POST /api/groups - Crear grupo
    if (method === 'POST' && path === '/api/groups') {
      const { name } = JSON.parse(event.body || '{}');
      if (!name) return sendError(400, 'El nombre del grupo es requerido');

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

      if (!name) return sendError(400, 'El nombre del usuario es requerido');

      // Verificar que el grupo existe
      const group = await db.collection('groups').findOne({ id: groupId });
      if (!group) return sendError(404, 'Grupo no encontrado');

      // Verificar si el usuario ya existe
      let user = await db.collection('users').findOne({ group_id: groupId, name });
      if (user) {
        return sendResponse(200, { userId: user.id, groupId, name });
      }

      // Crear nuevo usuario
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

      if (!name || !price || !location) {
        return sendError(400, 'Todos los campos son requeridos');
      }

      const giftId = generateGiftId();
      await db.collection('gifts').insertOne({
        id: giftId,
        user_id: userId,
        name,
        price,
        location,
        locked_by: null,
        created_at: new Date(),
      });

      return sendResponse(200, { giftId, userId, name, price, location, locked_by: null });
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

      if (!lockedBy) return sendError(400, 'El ID del usuario que bloquea es requerido');

      // Verificar si el regalo ya está bloqueado
      const gift = await db.collection('gifts').findOne({ id: giftId });

      if (!gift) return sendError(404, 'Regalo no encontrado');

      // Si ya está bloqueado por otro, devolver error
      if (gift.locked_by && gift.locked_by !== lockedBy) {
        return sendError(409, 'Este regalo ya fue asignado a otro usuario');
      }

      // Si ya está bloqueado por el mismo usuario, devolver success
      if (gift.locked_by === lockedBy) {
        return sendResponse(200, { success: true });
      }

      // Bloquear el regalo
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

      // Verificar que quien intenta desbloquear es quien lo bloqueó
      const gift = await db.collection('gifts').findOne({ id: giftId });

      if (!gift) return sendError(404, 'Regalo no encontrado');

      // Si no está bloqueado, no hay nada que desbloquear
      if (!gift.locked_by) {
        return sendResponse(200, { success: true });
      }

      // Solo quien lo bloqueó puede desbloquearlo
      if (unlockedBy && gift.locked_by !== unlockedBy) {
        return sendError(403, 'Solo quien bloqueó el regalo puede desbloquearlo');
      }

      // Desbloquear el regalo
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

    return sendError(404, 'Endpoint no encontrado');
  } catch (error) {
    console.error('Error en API:', error);
    return sendError(500, error.message);
  }
};
