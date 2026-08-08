-- HealthSense AI — reference PostgreSQL schema
-- (The app itself creates these automatically via SQLAlchemy; this file is
--  provided for DBAs who want to review/deploy the schema directly, or swap
--  DATABASE_URL to Postgres in production.)

CREATE TABLE users (
    id              VARCHAR PRIMARY KEY,
    name            VARCHAR NOT NULL,
    email           VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    role            VARCHAR NOT NULL,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE patients (
    id                   VARCHAR PRIMARY KEY,
    name                 VARCHAR NOT NULL,
    age                  INTEGER NOT NULL,
    gender               VARCHAR NOT NULL,
    phone                VARCHAR,
    address              VARCHAR,
    medical_history      TEXT,
    previous_conditions  TEXT,
    created_at           TIMESTAMP DEFAULT now()
);

CREATE TABLE screenings (
    id                     VARCHAR PRIMARY KEY,
    patient_id             VARCHAR NOT NULL REFERENCES patients(id),
    created_by             VARCHAR REFERENCES users(id),
    date                   VARCHAR NOT NULL,
    height_cm              FLOAT,
    weight_kg              FLOAT,
    bmi                    FLOAT,
    smoking                VARCHAR DEFAULT 'None',
    alcohol                VARCHAR DEFAULT 'None',
    activity               VARCHAR DEFAULT 'Moderate',
    diet                   VARCHAR DEFAULT 'Average',
    sleep_hours            FLOAT DEFAULT 7,
    stress                 VARCHAR DEFAULT 'Low',
    family_diabetes        BOOLEAN DEFAULT FALSE,
    family_hypertension    BOOLEAN DEFAULT FALSE,
    family_heart_disease   BOOLEAN DEFAULT FALSE,
    family_stroke          BOOLEAN DEFAULT FALSE,
    family_ckd             BOOLEAN DEFAULT FALSE,
    systolic               INTEGER,
    diastolic              INTEGER,
    heart_rate             INTEGER,
    ecg_file               VARCHAR,
    retinal_file           VARCHAR,
    symptoms               JSONB DEFAULT '[]',
    notes                  TEXT,
    created_at             TIMESTAMP DEFAULT now()
);

CREATE TABLE risk_reports (
    id                VARCHAR PRIMARY KEY,
    screening_id      VARCHAR NOT NULL REFERENCES screenings(id),
    diabetes_pct      INTEGER,
    hypertension_pct  INTEGER,
    cvd_pct           INTEGER,
    stroke_pct        INTEGER,
    ckd_pct           INTEGER,
    created_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE referrals (
    id                VARCHAR PRIMARY KEY,
    screening_id      VARCHAR NOT NULL REFERENCES screenings(id),
    patient_id        VARCHAR NOT NULL REFERENCES patients(id),
    disease           VARCHAR NOT NULL,
    risk_percent      INTEGER NOT NULL,
    risk_level        VARCHAR NOT NULL,
    specialist_role   VARCHAR NOT NULL,
    status            VARCHAR DEFAULT 'Draft',
    created_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE doctor_reviews (
    id            VARCHAR PRIMARY KEY,
    referral_id   VARCHAR NOT NULL REFERENCES referrals(id),
    doctor_id     VARCHAR REFERENCES users(id),
    notes         TEXT,
    viewed_at     TIMESTAMP,
    signed_at     TIMESTAMP
);

CREATE TABLE lab_tests (
    id            VARCHAR PRIMARY KEY,
    referral_id   VARCHAR NOT NULL REFERENCES referrals(id),
    test_name     VARCHAR NOT NULL,
    ordered_at    TIMESTAMP DEFAULT now(),
    status        VARCHAR DEFAULT 'Ordered'
);

CREATE TABLE notifications (
    id            VARCHAR PRIMARY KEY,
    role          VARCHAR NOT NULL,
    message       VARCHAR NOT NULL,
    is_read       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT now()
);

CREATE TABLE audit_logs (
    id            VARCHAR PRIMARY KEY,
    user_id       VARCHAR REFERENCES users(id),
    action        VARCHAR NOT NULL,
    entity        VARCHAR NOT NULL,
    entity_id     VARCHAR,
    created_at    TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_screenings_patient ON screenings(patient_id);
CREATE INDEX idx_referrals_role_status ON referrals(specialist_role, status);
CREATE INDEX idx_referrals_patient ON referrals(patient_id);
CREATE INDEX idx_notifications_role ON notifications(role);
