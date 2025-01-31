const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Connect to (or create) a local SQLite database file:
const dbPath = path.join(__dirname, "mydb.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Could not connect to SQLite database:", err);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Initialize tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  // Favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      movieId TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Links table
  db.run(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      favoriteId INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      isPublic INTEGER NOT NULL DEFAULT 0, 
      FOREIGN KEY(favoriteId) REFERENCES favorites(id)
    )
  `);
  
  // Likes table for links
  db.run(
  `CREATE TABLE IF NOT EXISTS link_likes (
    userId INTEGER NOT NULL,
    linkId INTEGER NOT NULL,
    PRIMARY KEY (userId, linkId),
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(linkId) REFERENCES links(id)
  )`
);

});

module.exports = db;