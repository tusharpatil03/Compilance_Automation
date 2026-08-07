-- =========================================================
-- Compliance Automation Platform — Module 1: Identity Management
-- Database Schema (PostgreSQL)
-- Source: FR-IDM-001 .. FR-IDM-019 (FR_Compliance_Automation.docx)
-- Status: DRAFT
-- Fields/tables marked [PROPOSED] fill gaps flagged in the source
-- doc under FR-IDM-013, FR-IDM-014, FR-IDM-017, FR-IDM-018
-- (see Section 7, "Open Items Requiring Clarification") and need
-- stakeholder confirmation before being treated as final.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

---

-- ENUM TYPES

---

-- FR-IDM-001/002: account/session lifecycle
CREATE TYPE account_status AS ENUM (
'REGISTERED', -- email/phone captured, Identity ID issued, OTP not yet confirmed
'ACTIVE', -- OTP confirmed, login enabled
'SUSPENDED', -- administratively suspended
'DEACTIVATED' -- user- or platform-closed
);

-- FR-IDM-018 [PROPOSED]: overall identity/KYC verification lifecycle
CREATE TYPE identity_verification_status AS ENUM (
'UNVERIFIED',
'IN_PROGRESS',
'VERIFIED',
'REJECTED',
'EXPIRED' -- reverification required
);

-- FR-IDM-005/006: per-version document status
CREATE TYPE document_status AS ENUM (
'UPLOADED',
'PROCESSING',
'EXTRACTED',
'VERIFIED',
'REJECTED',
'SUPERSEDED' -- replaced by a newer version
);

-- FR-IDM-008: multi-stage validation pipeline
CREATE TYPE verification_stage AS ENUM (
'FORMAT_CHECK',
'GOVERNMENT_VERIFICATION',
'FACE_MATCH',
'LIVENESS_DETECTION'
);

CREATE TYPE verification_status AS ENUM (
'PENDING',
'IN_PROGRESS',
'APPROVED',
'REJECTED',
'MANUAL_REVIEW'
);

CREATE TYPE stage_result AS ENUM (
'PENDING',
'PASSED',
'FAILED',
'SKIPPED'
);

-- FR-IDM-013 [PROPOSED]: AML screening
CREATE TYPE aml_status AS ENUM (
'NOT_SCREENED',
'SCREENING',
'CLEAR',
'POTENTIAL_MATCH',
'CONFIRMED_MATCH',
'FALSE_POSITIVE'
);

-- FR-IDM-014 [PROPOSED]: risk rating buckets
CREATE TYPE risk_rating AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE otp_purpose AS ENUM ('REGISTRATION', 'LOGIN', 'PASSWORD_RESET');
CREATE TYPE otp_channel AS ENUM ('EMAIL', 'SMS');
CREATE TYPE token_type AS ENUM ('JWT', 'PASETO');

---

-- CORE IDENTITY (FR-IDM-001, 003, 004, 018)

---

CREATE TABLE identities (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- "Identity ID"
email CITEXT UNIQUE,
phone_number VARCHAR(20) UNIQUE,
account_status account_status NOT NULL DEFAULT 'REGISTERED',
verification_status identity_verification_status NOT NULL DEFAULT 'UNVERIFIED',
trust_score NUMERIC(5,2), -- FR-IDM-003
risk_score NUMERIC(5,2), -- FR-IDM-014 [PROPOSED]
risk_rating risk_rating, -- FR-IDM-014 [PROPOSED]
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
CONSTRAINT chk_identity_contact CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE TABLE identity_profiles ( -- FR-IDM-003/004: editable profile fields
identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
full_name VARCHAR(255),
date_of_birth DATE,
address_line1 VARCHAR(255),
address_line2 VARCHAR(255),
city VARCHAR(100),
country VARCHAR(2), -- ISO 3166-1 alpha-2
postal_code VARCHAR(20),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity_profile_history ( -- FR-IDM-004: timestamped change log
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
field_name VARCHAR(100) NOT NULL,
old_value TEXT,
new_value TEXT,
changed_by UUID NOT NULL,
changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity_status_history ( -- FR-IDM-018 [PROPOSED]: status transition log
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
status_type VARCHAR(30) NOT NULL, -- 'account_status' | 'verification_status'
from_status VARCHAR(30),
to_status VARCHAR(30) NOT NULL,
reason TEXT,
changed_by UUID, -- NULL = system-triggered
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---

-- CREDENTIALS & SESSIONS (FR-IDM-002)

---

CREATE TABLE credentials (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
password_hash TEXT NOT NULL,
password_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE otp_codes (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
purpose otp_purpose NOT NULL,
channel otp_channel NOT NULL,
code_hash TEXT NOT NULL,
attempts SMALLINT NOT NULL DEFAULT 0,
max_attempts SMALLINT NOT NULL DEFAULT 5,
expires_at TIMESTAMPTZ NOT NULL,
consumed_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
token_type token_type NOT NULL,
token_id VARCHAR(255) NOT NULL UNIQUE, -- jti / paseto id, never the raw token
issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
expires_at TIMESTAMPTZ NOT NULL,
revoked_at TIMESTAMPTZ,
ip_address INET,
user_agent TEXT
);

---

-- DOCUMENTS (FR-IDM-005, 006, 007)

---

CREATE TABLE documents (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
document_type VARCHAR(50) NOT NULL, -- PASSPORT, NATIONAL_ID, DRIVERS_LICENSE, ...
current_version_id UUID, -- FK added below, after document_versions exists
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_versions ( -- FR-IDM-006: version history
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
version_number INTEGER NOT NULL,
storage_ref TEXT NOT NULL, -- pointer into encrypted object storage
status document_status NOT NULL DEFAULT 'UPLOADED',
uploaded_by UUID NOT NULL REFERENCES identities(id),
uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE (document_id, version_number)
);

ALTER TABLE documents
ADD CONSTRAINT fk_documents_current_version
FOREIGN KEY (current_version_id) REFERENCES document_versions(id);

CREATE TABLE document_extractions ( -- FR-IDM-007: OCR output
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
extracted_fields JSONB NOT NULL, -- {"full_name": "...", "dob": "...", ...}
ocr_confidence NUMERIC(5,4),
processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---

-- MULTI-STAGE VERIFICATION (FR-IDM-008, 009)

---

CREATE TABLE verifications (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
document_id UUID REFERENCES documents(id),
status verification_status NOT NULL DEFAULT 'PENDING',
started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
completed_at TIMESTAMPTZ
);

CREATE TABLE verification_stage_results (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
stage verification_stage NOT NULL,
result stage_result NOT NULL DEFAULT 'PENDING',
details JSONB,
started_at TIMESTAMPTZ,
completed_at TIMESTAMPTZ,
UNIQUE (verification_id, stage)
);

---

-- AML SCREENING (FR-IDM-013) [PROPOSED — gap-flagged in source]

---

CREATE TABLE aml_screenings (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
status aml_status NOT NULL DEFAULT 'NOT_SCREENED',
watchlist_source VARCHAR(100), -- e.g. OFAC, UN, EU consolidated list
match_details JSONB,
screened_at TIMESTAMPTZ,
resolved_by UUID,
resolution_notes TEXT,
resolved_at TIMESTAMPTZ
);

---

-- RISK ASSESSMENT (FR-IDM-014) [PROPOSED — gap-flagged in source]

---

CREATE TABLE risk_assessments (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
score NUMERIC(5,2) NOT NULL,
rating risk_rating NOT NULL,
factors JSONB, -- weighting breakdown, TBD with stakeholders
assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---

-- NOTIFICATIONS (FR-IDM-009, 017)

---

CREATE TABLE notifications (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
type VARCHAR(50) NOT NULL, -- e.g. VERIFICATION_APPROVED, DOCUMENT_REJECTED
channel VARCHAR(20) NOT NULL, -- EMAIL, SMS, IN_APP, PUSH
payload JSONB,
status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING/SENT/FAILED
sent_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---

-- ACTIVITY & AUDIT (FR-IDM-016, 019)

---

CREATE TABLE activity_logs ( -- FR-IDM-016: user-facing activity feed
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
actor_type VARCHAR(20) NOT NULL, -- USER, TENANT, ADMINISTRATOR, SYSTEM
actor_id UUID,
action VARCHAR(100) NOT NULL,
metadata JSONB,
ip_address INET,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs ( -- FR-IDM-019: immutable, compliance-grade
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
identity_id UUID NOT NULL REFERENCES identities(id),
actor_type VARCHAR(20) NOT NULL,
actor_id UUID,
action VARCHAR(100) NOT NULL,
previous_state JSONB,
new_state JSONB,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Enforce immutability at the DB level, e.g.:
-- REVOKE UPDATE, DELETE ON audit_logs FROM app_user;

---

-- INDEXES

---

CREATE INDEX idx_documents_identity ON documents(identity_id);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_verifications_identity ON verifications(identity_id);
CREATE INDEX idx_verification_stage_results_verification ON verification_stage_results(verification_id);
CREATE INDEX idx_aml_screenings_identity ON aml_screenings(identity_id);
CREATE INDEX idx_risk_assessments_identity ON risk_assessments(identity_id);
CREATE INDEX idx_notifications_identity ON notifications(identity_id);
CREATE INDEX idx_activity_logs_identity ON activity_logs(identity_id);
CREATE INDEX idx_audit_logs_identity ON audit_logs(identity_id);
CREATE INDEX idx_sessions_identity ON sessions(identity_id);
CREATE INDEX idx_otp_codes_identity_purpose ON otp_codes(identity_id, purpose);
