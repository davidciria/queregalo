const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/queregalo.db');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conectado a SQLite');
  }
});

// Inicializar la base de datos con las tablas necesarias
const init = (callback) => {
  db.serialize(() => {
    // Tabla de grupos
    db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(group_id) REFERENCES groups(id),
        UNIQUE(group_id, name)
      )
    `);

    // Tabla de regalos
    db.run(`
      CREATE TABLE IF NOT EXISTS gifts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price TEXT,
        location TEXT,
        locked_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(locked_by) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error al crear tablas:', err);
      } else {
        console.log('Tablas de base de datos inicializadas');
      }
      if (callback) callback();
    });
  });
};

module.exports = {
  db,
  init,
  run: function(sql, params, callback) {
    db.run(sql, params, callback);
  },
  get: function(sql, params, callback) {
    db.get(sql, params, callback);
  },
  all: function(sql, params, callback) {
    db.all(sql, params, callback);
  }
};
