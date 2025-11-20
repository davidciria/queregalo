const { connectToDatabase, ensureCollections } = require('./db');
const { generateSecureGroupId, sendResponse, sendError } = require('./utils');

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return sendResponse(200, {});
  }

  try {
    const db = await connectToDatabase();
    await ensureCollections(db);

    const method = event.httpMethod;
    const path = event.path.replace('/.netlify/functions/groups', '');

    // POST /api/groups - Crear grupo
    if (method === 'POST' && !path) {
      const { name } = JSON.parse(event.body || '{}');

      if (!name) {
        return sendError(400, 'El nombre del grupo es requerido');
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
    if (method === 'GET') {
      const groupId = path.substring(1); // Remove leading /
      const group = await db.collection('groups').findOne({ id: groupId });

      if (!group) {
        return sendError(404, 'Grupo no encontrado');
      }

      return sendResponse(200, group);
    }

    return sendError(405, 'Método no permitido');
  } catch (error) {
    console.error('Error en groups:', error);
    return sendError(500, error.message);
  }
};
