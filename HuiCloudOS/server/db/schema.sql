CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  title TEXT,
  category TEXT,
  metadata JSON,
  poster_path TEXT,
  video_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL DEFAULT 0,
  specs JSON,
  images JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  contact TEXT,
  phone TEXT,
  salesperson TEXT,
  items JSON,
  total REAL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sections JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT,
  logo_url TEXT,
  sales_team JSON,
  terms TEXT
);

INSERT INTO settings (id, company_name, logo_url, sales_team, terms)
  SELECT 1, '辉云易达', '', json('[]'), '默认条款'
  WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
