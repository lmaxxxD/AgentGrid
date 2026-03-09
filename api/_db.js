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
      confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

module.exports = { sql, initDB };
