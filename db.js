// Database setup: SQLite file (restaurant.db) tayar hote, tables banatat
const Database = require('better-sqlite3');
const db = new Database('restaurant.db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,            -- bcrypt hash, plain password nahi
  role TEXT NOT NULL DEFAULT 'customer'  -- 'customer' kinva 'admin'
);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Placed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price REAL NOT NULL                -- order velechi price save karto
);
`);

// Sample menu (pahilyandach)
if (db.prepare('SELECT COUNT(*) c FROM menu_items').get().c === 0) {
  const ins = db.prepare('INSERT INTO menu_items (name, price, category) VALUES (?,?,?)');
  [['Paneer Butter Masala', 220, 'Main'], ['Veg Biryani', 180, 'Main'],
   ['Masala Dosa', 90, 'Snacks'], ['Samosa', 30, 'Snacks'],
   ['Gulab Jamun', 60, 'Dessert'], ['Masala Chai', 20, 'Drinks']]
    .forEach(r => ins.run(...r));
}
module.exports = db;
