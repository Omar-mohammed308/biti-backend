import { query } from './db.js';

async function migrate() {
  console.log('⏳  Running migrations…');

  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  /* ── users ─────────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(255) NOT NULL,
      role          VARCHAR(50)  DEFAULT 'user',
      created_date  TIMESTAMPTZ  DEFAULT NOW(),
      updated_date  TIMESTAMPTZ  DEFAULT NOW()
    )
  `);

  /* ── user_profiles ──────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id                 UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      specialization          VARCHAR(50),
      selected_skills         JSONB        DEFAULT '{}',
      dream_company           VARCHAR(255),
      age                     INTEGER,
      location                VARCHAR(255),
      willing_to_relocate     BOOLEAN      DEFAULT false,
      skill_level             VARCHAR(50)  DEFAULT 'beginner',
      total_score             NUMERIC      DEFAULT 0,
      bitora_experience       NUMERIC      DEFAULT 0,
      bitora_days             INTEGER      DEFAULT 0,
      tasks_completed         INTEGER      DEFAULT 0,
      interview_completed     BOOLEAN      DEFAULT false,
      strengths               JSONB        DEFAULT '[]',
      weaknesses              JSONB        DEFAULT '[]',
      current_streak          INTEGER      DEFAULT 0,
      last_activity_date      DATE,
      performance_rating      NUMERIC      DEFAULT 100,
      missed_deadlines        INTEGER      DEFAULT 0,
      profile_image           TEXT,
      learning_recommendations JSONB       DEFAULT '[]',
      skill_gap_analysis      JSONB,
      created_date            TIMESTAMPTZ  DEFAULT NOW(),
      updated_date            TIMESTAMPTZ  DEFAULT NOW()
    )
  `);

  /* ── company_states ─────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS company_states (
      id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id                UUID REFERENCES users(id) ON DELETE CASCADE,
      company_name           VARCHAR(255),
      company_product        TEXT,
      company_scale          VARCHAR(255),
      domain                 VARCHAR(50),
      career_level           VARCHAR(50),
      challenges_completed   INTEGER  DEFAULT 0,
      reputation_score       NUMERIC  DEFAULT 100,
      reliability_score      NUMERIC  DEFAULT 100,
      velocity_score         NUMERIC  DEFAULT 100,
      security_risk_score    NUMERIC  DEFAULT 0,
      operational_maturity   NUMERIC  DEFAULT 50,
      technical_debt_level   NUMERIC  DEFAULT 0,
      architectural_decisions JSONB   DEFAULT '[]',
      past_incidents         JSONB    DEFAULT '[]',
      ignored_warnings       JSONB    DEFAULT '[]',
      company_memory         TEXT,
      created_date           TIMESTAMPTZ DEFAULT NOW(),
      updated_date           TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  /* ── engineering_challenges ─────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS engineering_challenges (
      id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id                   UUID REFERENCES users(id) ON DELETE CASCADE,
      title                     VARCHAR(500),
      level                     VARCHAR(50),
      specialization            VARCHAR(50),
      current_phase             INTEGER  DEFAULT 1,
      prd                       JSONB,
      design_submission         TEXT,
      design_review             JSONB,
      design_approved           BOOLEAN  DEFAULT false,
      implementation_requirements JSONB,
      implementation_code       TEXT,
      implementation_github     VARCHAR(500),
      code_review               JSONB,
      code_approved             BOOLEAN  DEFAULT false,
      production_incident       JSONB,
      incident_response         TEXT,
      incident_evaluation       JSONB,
      evaluation                JSONB,
      final_score               NUMERIC,
      completed                 BOOLEAN  DEFAULT false,
      created_date              TIMESTAMPTZ DEFAULT NOW(),
      updated_date              TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  /* ── tasks ──────────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
      title               VARCHAR(500) NOT NULL,
      description         TEXT,
      requirements        JSONB   DEFAULT '[]',
      acceptance_criteria JSONB   DEFAULT '[]',
      difficulty          VARCHAR(50),
      specialization      VARCHAR(50),
      deadline            TIMESTAMPTZ,
      status              VARCHAR(50) DEFAULT 'assigned',
      duration_days       INTEGER DEFAULT 4,
      penalty_applied     BOOLEAN DEFAULT false,
      created_date        TIMESTAMPTZ DEFAULT NOW(),
      updated_date        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  /* ── submissions ────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
      task_id      UUID REFERENCES tasks(id) ON DELETE CASCADE,
      code         TEXT,
      file_url     TEXT,
      notes        TEXT,
      status       VARCHAR(50) DEFAULT 'pending',
      created_date TIMESTAMPTZ DEFAULT NOW(),
      updated_date TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  /* ── reviews ────────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      submission_id  UUID REFERENCES submissions(id) ON DELETE CASCADE,
      task_id        UUID REFERENCES tasks(id) ON DELETE CASCADE,
      user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
      score          NUMERIC,
      feedback       TEXT,
      code_quality   NUMERIC,
      architecture   NUMERIC,
      best_practices NUMERIC,
      performance    NUMERIC,
      strengths      JSONB DEFAULT '[]',
      weaknesses     JSONB DEFAULT '[]',
      passed         BOOLEAN,
      suggestions    JSONB DEFAULT '[]',
      created_date   TIMESTAMPTZ DEFAULT NOW(),
      updated_date   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  /* ── badges ─────────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS badges (
      id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
      badge_type       VARCHAR(100),
      badge_name       VARCHAR(255),
      badge_description TEXT,
      badge_icon       VARCHAR(50),
      earned_date      TIMESTAMPTZ DEFAULT NOW(),
      badge_rarity     VARCHAR(50),
      created_date     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, badge_type)
    )
  `);

  /* ── goals ──────────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS goals (
      id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
      goal_type      VARCHAR(100),
      title          VARCHAR(500),
      description    TEXT,
      target_value   NUMERIC,
      current_value  NUMERIC  DEFAULT 0,
      deadline       DATE,
      completed      BOOLEAN  DEFAULT false,
      completed_date TIMESTAMPTZ,
      reward_points  NUMERIC  DEFAULT 0,
      created_date   TIMESTAMPTZ DEFAULT NOW(),
      updated_date   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  /* ── interviews ─────────────────────────────────────────────────── */
  await query(`
    CREATE TABLE IF NOT EXISTS interviews (
      id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
      specialization      VARCHAR(50),
      custom_scenario     TEXT,
      custom_role         VARCHAR(255),
      evaluation_criteria JSONB  DEFAULT '[]',
      questions           JSONB  DEFAULT '[]',
      score               NUMERIC,
      feedback            TEXT,
      strengths           JSONB  DEFAULT '[]',
      weaknesses          JSONB  DEFAULT '[]',
      recommendations     JSONB  DEFAULT '[]',
      completed           BOOLEAN DEFAULT false,
      adaptive_difficulty VARCHAR(50) DEFAULT 'intermediate',
      created_date        TIMESTAMPTZ DEFAULT NOW(),
      updated_date        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  /* ── indexes ────────────────────────────────────────────────────── */
  const idx = [
    `CREATE INDEX IF NOT EXISTS idx_profiles_user   ON user_profiles(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_user       ON tasks(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status)`,
    `CREATE INDEX IF NOT EXISTS idx_subs_user        ON submissions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subs_task        ON submissions(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_user     ON reviews(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_challenges_user  ON engineering_challenges(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_badges_user      ON badges(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_companies_user   ON company_states(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_interviews_user  ON interviews(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_goals_user       ON goals(user_id)`,
  ];
  for (const i of idx) await query(i);

  console.log('✅  All tables and indexes ready!');
  process.exit(0);
}

migrate().catch(e => { console.error('Migration failed:', e); process.exit(1); });
