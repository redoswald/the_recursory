import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
  CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
`);

export default db;

// User operations
export const userQueries = {
  create: db.prepare(`
    INSERT INTO users (id, email, password, name)
    VALUES (?, ?, ?, ?)
  `),

  findByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),

  findById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),
};

// Article operations
export const articleQueries = {
  create: db.prepare(`
    INSERT INTO articles (id, title, content, slug, user_id)
    VALUES (?, ?, ?, ?, ?)
  `),

  findBySlug: db.prepare(`
    SELECT a.*, u.name as author_name, u.email as author_email
    FROM articles a
    JOIN users u ON a.user_id = u.id
    WHERE a.slug = ?
  `),

  checkSlugExists: db.prepare(`
    SELECT id FROM articles WHERE slug = ?
  `),

  findById: db.prepare(`
    SELECT * FROM articles WHERE id = ?
  `),

  findByUserId: db.prepare(`
    SELECT * FROM articles WHERE user_id = ? ORDER BY created_at DESC
  `),

  findAll: db.prepare(`
    SELECT a.*, u.name as author_name, u.email as author_email
    FROM articles a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
  `),

  update: db.prepare(`
    UPDATE articles
    SET title = ?, content = ?, slug = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `),

  delete: db.prepare(`
    DELETE FROM articles WHERE id = ? AND user_id = ?
  `),
};

export type User = {
  id: string;
  email: string;
  password: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type Article = {
  id: string;
  title: string;
  content: string;
  slug: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
};
