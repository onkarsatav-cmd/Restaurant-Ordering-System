const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const SECRET = process.env.JWT_SECRET || 'change-this-secret';
app.use(express.json());
app.use(express.static('public'));

// ---------- Middleware ----------
// Request madhla JWT token tapasto, user kon ahe te req.user madhe thevto
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Login required' }); }
}
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// ---------- Auth ----------
app.post('/api/register', (req, res) => {
  const { name, email, password, admin } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const hash = bcrypt.hashSync(password, 10);
  // Demo sathi: pahila registered user admin hoto
  const first = db.prepare('SELECT COUNT(*) c FROM users').get().c === 0;
  try {
    db.prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)')
      .run(name, email, hash, first ? 'admin' : 'customer');
    res.json({ message: 'Registered' });
  } catch { res.status(400).json({ error: 'Email already used' }); }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Wrong email or password' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '1d' });
  res.json({ token, name: user.name, role: user.role });
});

// ---------- Menu ----------
app.get('/api/menu', (req, res) => res.json(db.prepare('SELECT * FROM menu_items').all()));

app.post('/api/menu', auth, adminOnly, (req, res) => {
  const { name, price, category } = req.body;
  const r = db.prepare('INSERT INTO menu_items (name,price,category) VALUES (?,?,?)').run(name, price, category);
  res.json({ id: r.lastInsertRowid });
});
app.delete('/api/menu/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ---------- Orders ----------
app.post('/api/orders', auth, (req, res) => {
  const items = req.body.items; // [{id, quantity}]
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Cart empty' });
  const getItem = db.prepare('SELECT * FROM menu_items WHERE id=?');
  const place = db.transaction(() => {
    let total = 0;
    const rows = items.map(i => {
      const m = getItem.get(i.id);
      if (!m) throw new Error('Invalid item');
      total += m.price * i.quantity;            // price server var calculate hote (safe)
      return { id: m.id, q: i.quantity, price: m.price };
    });
    const o = db.prepare('INSERT INTO orders (user_id,total) VALUES (?,?)').run(req.user.id, total);
    const ins = db.prepare('INSERT INTO order_items (order_id,menu_item_id,quantity,price) VALUES (?,?,?,?)');
    rows.forEach(r => ins.run(o.lastInsertRowid, r.id, r.q, r.price));
    return { orderId: o.lastInsertRowid, total };
  });
  try { res.json(place()); } catch (e) { res.status(400).json({ error: e.message }); }
});

// Customer: swatahche orders. Admin: sagale orders.
app.get('/api/orders', auth, (req, res) => {
  const sql = `SELECT o.id,o.total,o.status,o.created_at,u.name customer,
    GROUP_CONCAT(m.name||' x'||oi.quantity, ', ') items
    FROM orders o JOIN users u ON u.id=o.user_id
    JOIN order_items oi ON oi.order_id=o.id JOIN menu_items m ON m.id=oi.menu_item_id
    ${req.user.role === 'admin' ? '' : 'WHERE o.user_id=?'}
    GROUP BY o.id ORDER BY o.id DESC`;
  const stmt = db.prepare(sql);
  res.json(req.user.role === 'admin' ? stmt.all() : stmt.all(req.user.id));
});

app.patch('/api/orders/:id', auth, adminOnly, (req, res) => {
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ message: 'Updated' });
});

app.listen(3000, () => console.log('Running on http://localhost:3000'));
