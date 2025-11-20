const { connectToDatabase, ensureCollections } = require('./db');
const { generateGiftId, sendResponse, sendError } = require('./utils');

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

    // POST /api/groups/:groupId/users/:userId/gifts - Crear regalo
    const createGiftMatch = path.match(/\/groups\/([^/]+)\/users\/([^/]+)\/gifts$/);
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
    const userGiftsMatch = path.match(/\/groups\/([^/]+)\/users\/([^/]+)\/gifts$/);
    if (method === 'GET' && userGiftsMatch) {
      const userId = userGiftsMatch[2];
      const gifts = await db.collection('gifts').find({ user_id: userId }).toArray();
      return sendResponse(200, gifts || []);
    }

    // GET /api/groups/:groupId/gifts - Todos los regalos del grupo
    const allGiftsMatch = path.match(/\/groups\/([^/]+)\/gifts$/);
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
    const lockMatch = path.match(/\/gifts\/([^/]+)\/lock$/);
    if (method === 'PUT' && lockMatch) {
      const giftId = lockMatch[1];
      const { lockedBy } = JSON.parse(event.body || '{}');

      if (!lockedBy) {
        return sendError(400, 'El ID del usuario que bloquea es requerido');
      }

      // Verificar si el regalo ya está bloqueado
      const gift = await db.collection('gifts').findOne({ id: giftId });

      if (!gift) {
        return sendError(404, 'Regalo no encontrado');
      }

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
    const unlockMatch = path.match(/\/gifts\/([^/]+)\/unlock$/);
    if (method === 'PUT' && unlockMatch) {
      const giftId = unlockMatch[1];
      const { unlockedBy } = JSON.parse(event.body || '{}');

      // Verificar que quien intenta desbloquear es quien lo bloqueó
      const gift = await db.collection('gifts').findOne({ id: giftId });

      if (!gift) {
        return sendError(404, 'Regalo no encontrado');
      }

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
    const deleteMatch = path.match(/\/gifts\/([^/]+)$/);
    if (method === 'DELETE' && deleteMatch) {
      const giftId = deleteMatch[1];
      await db.collection('gifts').deleteOne({ id: giftId });
      return sendResponse(200, { success: true });
    }

    return sendError(405, 'Método no permitido');
  } catch (error) {
    console.error('Error en gifts:', error);
    return sendError(500, error.message);
  }
};
