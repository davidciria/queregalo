const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'queregalo';

// Cache para reutilizar conexiones
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // Si ya tenemos una conexión válida, la reutilizamos
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      retryWrites: false,
      maxPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      tls: true,
      tlsInsecure: process.env.NODE_ENV === 'development',
      tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development',
    });

    await client.connect();
    cachedClient = client;
    cachedDb = client.db(DB_NAME);

    return cachedDb;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    throw error;
  }
}

// Crear colecciones si no existen
async function ensureCollections(db) {
  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('groups')) {
      await db.createCollection('groups');
      await db.collection('groups').createIndex({ id: 1 }, { unique: true });
    }

    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      await db.collection('users').createIndex({ id: 1 }, { unique: true });
      await db.collection('users').createIndex({ group_id: 1, name: 1 }, { unique: true });
    }

    if (!collectionNames.includes('gifts')) {
      await db.createCollection('gifts');
      await db.collection('gifts').createIndex({ id: 1 }, { unique: true });
      await db.collection('gifts').createIndex({ user_id: 1 });
    }
  } catch (error) {
    // Las colecciones probablemente ya existen
    console.log('Colecciones ya existen o no se pueden crear');
  }
}

module.exports = {
  connectToDatabase,
  ensureCollections,
};
