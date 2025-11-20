const { connectToDatabase, ensureCollections } = require('./db');
const { generateUserId, sendResponse, sendError } = require('./utils');

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return sendResponse(200, {});
  }

  try {
    const db = await connectToDatabase();
    await ensureCollections(db);

    const method = event.httpMethod;
    const pathMatch = event.path.match(/\/groups\/([^/]+)\/users(?:\/(.*))?/);

    if (!pathMatch) {
      return sendError(400, 'Ruta inválida');
    }

    const groupId = pathMatch[1];

    // POST /api/groups/:groupId/users - Crear/obtener usuario
    if (method === 'POST') {
      const { name } = JSON.parse(event.body || '{}');

      if (!name) {
        return sendError(400, 'El nombre del usuario es requerido');
      }

      // Verificar que el grupo existe
      const group = await db.collection('groups').findOne({ id: groupId });
      if (!group) {
        return sendError(404, 'Grupo no encontrado');
      }

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
    if (method === 'GET') {
      const users = await db
        .collection('users')
        .find({ group_id: groupId })
        .project({ id: 1, name: 1 })
        .toArray();

      return sendResponse(200, users || []);
    }

    return sendError(405, 'Método no permitido');
  } catch (error) {
    console.error('Error en users:', error);
    return sendError(500, error.message);
  }
};
