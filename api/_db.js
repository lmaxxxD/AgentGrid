const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS cells (
      id          SERIAL PRIMARY KEY,
      row         INTEGER NOT NULL,
      col         INTEGER NOT NULL,
      width       INTEGER NOT NULL DEFAULT 1,
      height      INTEGER NOT NULL DEFAULT 1,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      url         TEXT DEFAULT '',
      emoji       TEXT DEFAULT '🤖',
      color       TEXT DEFAULT '#00ffcc',
      category    TEXT DEFAULT 'Other',
      tx_hash     TEXT UNIQUE NOT NULL,
      price_paid  REAL NOT NULL,
      salute_count INTEGER NOT NULL DEFAULT 0,
      confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE cells ADD COLUMN IF NOT EXISTS salute_count INTEGER NOT NULL DEFAULT 0`;

  await sql`
    CREATE TABLE IF NOT EXISTS salutes (
      id         SERIAL PRIMARY KEY,
      cell_id    INTEGER NOT NULL,
      visitor_ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(cell_id, visitor_ip)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS guestbook (
      id         SERIAL PRIMARY KEY,
      cell_id    INTEGER NOT NULL,
      nickname   TEXT NOT NULL DEFAULT 'Anonymous',
      message    TEXT NOT NULL,
      visitor_ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

module.exports = { sql, initDB };
