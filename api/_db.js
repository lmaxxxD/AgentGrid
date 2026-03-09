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
      for_sale    BOOLEAN NOT NULL DEFAULT FALSE,
      asking_price REAL DEFAULT 0,
      seller_wallet TEXT DEFAULT '',
      confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Add resale columns if they don't exist (migration for existing DBs)
  await sql`ALTER TABLE cells ADD COLUMN IF NOT EXISTS for_sale BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE cells ADD COLUMN IF NOT EXISTS asking_price REAL DEFAULT 0`;
  await sql`ALTER TABLE cells ADD COLUMN IF NOT EXISTS seller_wallet TEXT DEFAULT ''`;

  // Settlements table — tracks money owed to sellers after resale
  await sql`
    CREATE TABLE IF NOT EXISTS settlements (
      id            SERIAL PRIMARY KEY,
      cell_id       INTEGER NOT NULL,
      seller_wallet TEXT NOT NULL,
      amount        REAL NOT NULL,
      platform_fee  REAL NOT NULL,
      buyer_tx_hash TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at       TIMESTAMPTZ
    )
  `;
}

module.exports = { sql, initDB };
