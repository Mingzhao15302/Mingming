PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  size INTEGER NOT NULL,
  duration REAL,
  category TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'CNY',
  specs JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  contact TEXT,
  salesperson TEXT,
  items JSON NOT NULL,
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body JSON NOT NULL,
  discount REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT,
  logo_path TEXT,
  sales_team JSON,
  terms TEXT
);
