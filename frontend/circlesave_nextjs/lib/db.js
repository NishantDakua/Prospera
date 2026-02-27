import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("neon")
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/* ── Role constants ─────────────────────────────────────────────────── */
export const ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  CUSTOMER: "customer",
};

/**
 * Initialize all tables. Called from the seed API route or on first deploy.
 */
export async function initDB() {
  /* ── users ──────────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id              SERIAL PRIMARY KEY,
      email           VARCHAR(255) UNIQUE NOT NULL,
      password_hash   VARCHAR(255) NOT NULL,
      full_name       VARCHAR(255) NOT NULL,
      phone           VARCHAR(20),
      wallet_address  VARCHAR(42),
      role            VARCHAR(20) DEFAULT 'customer'
                        CHECK (role IN ('admin','moderator','customer')),
      is_verified     BOOLEAN DEFAULT FALSE,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  /* add columns if table already exists (safe migration) */
  await query(`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `);

  /* ── kyc ────────────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS kyc (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status          VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending','submitted','verified','rejected')),
      reviewed_by     INTEGER REFERENCES users(id),
      rejection_reason TEXT,
      -- Personal
      date_of_birth   DATE,
      gender          VARCHAR(10),
      address_line    TEXT,
      city            VARCHAR(100),
      state           VARCHAR(100),
      pincode         VARCHAR(10),
      -- Identity Documents
      aadhaar_number  VARCHAR(12),
      pan_number      VARCHAR(10),
      -- Bank
      bank_name       VARCHAR(100),
      bank_account    VARCHAR(20),
      ifsc_code       VARCHAR(11),
      -- Nomination
      nominee_name    VARCHAR(255),
      nominee_relation VARCHAR(50),
      -- Meta
      submitted_at    TIMESTAMPTZ,
      verified_at     TIMESTAMPTZ,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  /* add columns if table already exists (safe migration) */
  await query(`
    DO $$ BEGIN
      ALTER TABLE kyc ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);
      ALTER TABLE kyc ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `);

  /* ── user_wallets (one account → many wallets, one wallet → one account) */
  await query(`
    CREATE TABLE IF NOT EXISTS user_wallets (
      id             SERIAL PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_address VARCHAR(42) NOT NULL,
      label          VARCHAR(100),
      linked_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (wallet_address)
    );
  `);

  /* ── flags (moderator raised flags on pool actions) ─────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS flags (
      id          SERIAL PRIMARY KEY,
      raised_by   INTEGER NOT NULL REFERENCES users(id),
      pool_id     INTEGER NOT NULL,
      reason      TEXT NOT NULL,
      severity    VARCHAR(20) DEFAULT 'warning'
                    CHECK (severity IN ('info','warning','critical')),
      status      VARCHAR(20) DEFAULT 'open'
                    CHECK (status IN ('open','acknowledged','resolved','dismissed')),
      resolved_by INTEGER REFERENCES users(id),
      resolved_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  /* ── audit log ─────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id          SERIAL PRIMARY KEY,
      actor_id    INTEGER NOT NULL REFERENCES users(id),
      action      VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id   INTEGER,
      details     JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  /* ── Seed first admin if no admin exists ────────────────────────── */
  const adminCheck = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (adminCheck.rows.length === 0) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("admin123456", 12);
    await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified)
       VALUES ($1, $2, $3, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE SET role = 'admin', is_verified = TRUE`,
      ["admin@circlesave.io", hash, "Platform Admin"]
    );
    console.log("🔑 Seeded admin: admin@circlesave.io / admin123456");
  }

  return { success: true };
}
