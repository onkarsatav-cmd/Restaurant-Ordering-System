# Restaurant Ordering System

Full-stack web app: customers menu pahun order karu shaktat, admin menu ani orders manage karto.

## Tech Stack
- **Frontend:** HTML, CSS, vanilla JavaScript (`public/`)
- **Backend:** Node.js + Express (`server.js`)
- **Database:** SQLite via better-sqlite3 (`db.js`)
- **Auth:** bcrypt password hashing + JWT, roles: customer / admin

## Features
- Register / Login
- Menu browse, cart, place order, order history
- Admin: menu add/delete, saglya orders chi status update

## Run
```bash
npm install
npm start
```
Open http://localhost:3000

> Pahila register kelela user automatic **admin** hoto. Nantar che sagle customer.

## API
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/register, /api/login | public |
| GET | /api/menu | public |
| POST/DELETE | /api/menu | admin |
| POST/GET | /api/orders | logged in |
| PATCH | /api/orders/:id | admin |

## Database tables
`users`, `menu_items`, `orders`, `order_items`
