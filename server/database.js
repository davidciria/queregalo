const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thedacima99_db_user:rMVdW2ZqcvV3fMyV@queregalo.aa9hovk.mongodb.net/?appName=QueRegalo';
const DB_NAME = 'queregalo';

let client;
let db;

const connect = async () => {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Conectado a MongoDB');
    return db;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    throw error;
  }
};

const init = async (callback) => {
  try {
    // Crear colecciones si no existen
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('groups')) {
      await db.createCollection('groups');
      await db.collection('groups').createIndex({ id: 1 }, { unique: true });
      console.log('Colección "groups" creada');
    }

    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      await db.collection('users').createIndex({ id: 1 }, { unique: true });
      await db.collection('users').createIndex({ group_id: 1, name: 1 }, { unique: true });
      console.log('Colección "users" creada');
    }

    if (!collectionNames.includes('gifts')) {
      await db.createCollection('gifts');
      await db.collection('gifts').createIndex({ id: 1 }, { unique: true });
      await db.collection('gifts').createIndex({ user_id: 1 });
      console.log('Colección "gifts" creada');
    }

    console.log('Colecciones de base de datos inicializadas');
    if (callback) callback();
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
    if (callback) callback();
  }
};

const getDb = () => db;

module.exports = {
  connect,
  init,
  getDb,
  db: { get: () => db }
};
