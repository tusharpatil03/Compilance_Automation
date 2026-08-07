# =========================================================

# Compliance Automation Platform — Module 1: Identity Management

# Operation Flow Specification

# Source: FR_Compliance_Automation.docx (FR-IDM-001 .. FR-IDM-019)

#

# Companion files:

# schema.sql — DB tables referenced by db_tables below

# state-machines.json — state machines referenced by state_transition below

#

# Entries marked gap: true correspond to Section 7 ("Open Items

# Requiring Clarification") in the source doc. Their steps/outputs

# are proposed designs, not confirmed requirements.

# =========================================================

- id: FR-IDM-001
  title: User Registration & Identity Creation
  actors: [User]
  trigger: "POST /identities"
  preconditions:
  - email or phone not already present in identities
    steps:
  - Validate email/phone format
  - Check uniqueness against identities table
  - Insert identities row (account_status=REGISTERED)
  - Generate OTP (otp_codes, purpose=REGISTRATION), deliver via channel
  - Await OTP confirmation (continues in FR-IDM-002)
    state_transition:
    machine: identityAccountStatus
    event: (row creation) -> initial state REGISTERED
    outputs:
  - identity_id
  - registration_status: pending_otp
    errors:
  - EMAIL_ALREADY_REGISTERED
  - PHONE_ALREADY_REGISTERED
  - INVALID_CONTACT_FORMAT
    db_tables: [identities, otp_codes, identity_status_history]
    gap: false

- id: FR-IDM-002
  title: Account Credential & Session Management
  actors: [User]
  trigger: "POST /auth/login | POST /auth/logout | POST /auth/password-reset"
  preconditions:
  - "login: identities.account_status == ACTIVE"
    steps:
    login:
    - Verify credentials (password_hash) or OTP
    - Issue session (JWT or PASETO), persist sessions row
      logout:
    - Revoke session (sessions.revoked_at = now())
      password_reset:
    - Request OTP (purpose=PASSWORD_RESET)
    - Verify OTP, update credentials.password_hash
      otp_confirmation_from_FR-IDM-001:
    - Verify OTP (purpose=REGISTRATION)
    - Fire event OTP_VERIFIED on identityAccountStatus machine
      state_transition:
      machine: identityAccountStatus
      event: OTP_VERIFIED
      from: REGISTERED
      to: ACTIVE
      outputs:
  - session_token (JWT/PASETO)
    errors:
  - INVALID_CREDENTIALS
  - ACCOUNT_SUSPENDED
  - OTP_EXPIRED
  - OTP_MAX_ATTEMPTS_EXCEEDED
    db_tables: [credentials, sessions, otp_codes, identity_status_history]
    gap: false

- id: FR-IDM-003
  title: View Identity Profile & Trust Score
  actors: [User]
  trigger: "GET /identities/{id}/profile"
  preconditions:
  - valid session
  - requester is the identity owner or an Administrator
    steps:
  - Fetch identities + identity_profiles row
  - Return trust_score
    state_transition: null
    outputs: [identity_profile, trust_score]
    errors: [NOT_FOUND, FORBIDDEN]
    db_tables: [identities, identity_profiles]
    gap: false

- id: FR-IDM-004
  title: Update Profile Information
  actors: [User]
  trigger: "PATCH /identities/{id}/profile"
  preconditions:
  - valid session
  - submitted field(s) are in the editable-field allowlist
    steps:
  - Validate submitted fields
  - For each changed field, insert identity_profile_history (old_value, new_value)
  - Update identity_profiles, set updated_at = now()
    state_transition: null
    outputs: [updated_profile]
    errors: [VALIDATION_ERROR, FIELD_NOT_EDITABLE]
    db_tables: [identity_profiles, identity_profile_history]
    gap: false

- id: FR-IDM-005
  title: Identity Document Upload & Management
  actors: [User]
  trigger: "POST /identities/{id}/documents | PUT /documents/{docId} | GET /documents/{docId}/download"
  steps:
  upload: - Create documents row if document_type is new for this identity - Insert document_versions (version_number = max+1, status=UPLOADED) - Update documents.current_version_id - Enqueue OCR pipeline (triggers FR-IDM-007)
  replace: - Same as upload, then set prior version's status = SUPERSEDED
  download: - Stream storage_ref for a version owned by identity_id
  state_transition:
  machine: documentVersionStatus
  event: (row creation) -> initial state UPLOADED
  outputs: [document_id, version_number]
  errors: [UNSUPPORTED_DOCUMENT_TYPE, FILE_TOO_LARGE, NOT_OWNER]
  db_tables: [documents, document_versions]
  gap: false

- id: FR-IDM-006
  title: Document Version History
  actors: [User, Administrator, Auditor]
  trigger: "GET /identities/{id}/documents/{docId}/versions"
  steps:
  - Fetch all document_versions for docId, ordered by version_number
    state_transition: null
    outputs: [chronological_version_list]
    db_tables: [document_versions]
    gap: false

- id: FR-IDM-007
  title: OCR-Based Data Extraction
  actors: [Compliance Platform]
  trigger: "async worker, on document_versions.status == UPLOADED"
  steps:
  - Set document_versions.status = PROCESSING
  - Run OCR against storage_ref
  - Insert document_extractions (extracted_fields, ocr_confidence)
  - Set document_versions.status = EXTRACTED
    state_transition:
    machine: documentVersionStatus
    event: [OCR_STARTED, OCR_COMPLETED]
    path: "UPLOADED -> PROCESSING -> EXTRACTED"
    outputs: [extracted_fields, ocr_confidence]
    errors: [OCR_ILLEGIBLE_DOCUMENT, OCR_TIMEOUT]
    db_tables: [document_extractions, document_versions]
    gap: false

- id: FR-IDM-008
  title: Multi-Stage Identity Validation
  actors: [Compliance Platform]
  trigger: "on document_versions.status == EXTRACTED, or explicit re-verification request"
  steps:
  - Create verifications row (status=PENDING), linked to document_id
  - Run stage FORMAT_CHECK -> verification_stage_results
  - Run stage GOVERNMENT_VERIFICATION
  - Run stage FACE_MATCH
  - Run stage LIVENESS_DETECTION
  - Aggregate stage results per verificationPipeline guards (ALL_STAGES_PASSED / STAGE_FAILED_HARD / STAGE_FAILED_SOFT)
    state_transition:
    machine: verificationPipeline
    path: "PENDING -> IN_PROGRESS -> {APPROVED | REJECTED | MANUAL_REVIEW}"
    per_stage_machine: verificationStageResult
    outputs: [verification_status, per_stage_results]
    errors: [STAGE_PROVIDER_UNAVAILABLE]
    db_tables: [verifications, verification_stage_results]
    gap: false

- id: FR-IDM-009
  title: Verification Outcome Notification
  actors: [User]
  trigger: "on verifications.status -> APPROVED or REJECTED"
  steps:
  - Insert notifications row
  - Deliver via configured channel
  - Propagate outcome to identityVerificationStatus machine
    state_transition:
    machine: identityVerificationStatus
    event: [VERIFICATION_APPROVED, VERIFICATION_REJECTED]
    from: IN_PROGRESS
    to: "VERIFIED | REJECTED"
    outputs: [notification_sent]
    db_tables: [notifications, identity_status_history]
    gap: false

- id: FR-IDM-010
  title: Consent Management (cross-module reference)
  actors: [User]
  note: "No independent flow — fully specified under Module: Consent Management, FR-CM-001 onward."
  gap: false

- id: FR-IDM-011
  title: Verification Sharing
  actors: [User, Tenant]
  note: "No independent flow — see Module: Consent Management, FR-CM-008 (Consent Scope Management)."
  gap: false

- id: FR-IDM-012
  title: Access Revocation
  actors: [User]
  note: "No independent flow — see Module: Consent Management, FR-CM-005 (Consent Revocation)."
  gap: false

- id: FR-IDM-013
  title: AML Screening
  actors: [Compliance Platform]
  trigger: "[PROPOSED] on identityVerificationStatus -> IN_PROGRESS, or scheduled rescreen"
  steps:
  - "[PROPOSED] Set aml_screenings.status = SCREENING"
  - "[PROPOSED] Query configured watchlist source(s)"
  - "[PROPOSED] No match -> status = CLEAR"
  - "[PROPOSED] Match -> status = POTENTIAL_MATCH, route to Administrator for manual review -> CONFIRMED_MATCH or FALSE_POSITIVE"
    state_transition:
    machine: amlScreeningStatus
    outputs: ["[PROPOSED] screening_result"]
    db_tables: [aml_screenings]
    gap: true
    gap_note: "Source doc (Section 1.6 / Section 7, FR-IDM-013) lists only a heading. Inputs, screening logic, match-handling rules, and outputs are undefined; the above is a proposal pending stakeholder confirmation."

- id: FR-IDM-014
  title: Risk Assessment
  actors: [Compliance Platform]
  trigger: "[PROPOSED] on verification APPROVED, or periodic re-assessment"
  steps:
  - "[PROPOSED] Gather risk factors (geography, document quality, AML outcome, occupation, etc. — TBD)"
  - "[PROPOSED] Compute score, map to risk_rating bucket"
  - "[PROPOSED] Insert risk_assessments row; update identities.risk_score / risk_rating"
    state_transition: null
    outputs: ["[PROPOSED] risk_score", "[PROPOSED] risk_rating"]
    db_tables: [risk_assessments, identities]
    gap: true
    gap_note: "Source doc (Section 1.7 / Section 7, FR-IDM-014) lists only a heading. Scoring inputs, weighting, and thresholds are undefined; the above is a proposal pending stakeholder confirmation. Related: FR-TEN-011 (tenant-side risk policy configuration) may ultimately drive these weights per tenant."

- id: FR-IDM-015
  title: User Dashboard
  actors: [User]
  trigger: "GET /identities/{id}/dashboard"
  steps:
  - Aggregate read across identities, verifications, documents, aml_screenings, consents (Module 3), notifications, activity_logs
    state_transition: null
    outputs:
  - verification_status
  - risk_score
  - uploaded_documents
  - verification_history
  - aml_status
  - consents
  - shared_organizations
  - notifications
  - recent_activities
    db_tables: "[read-only aggregation, no writes]"
    gap: false

- id: FR-IDM-016
  title: Activity History
  actors: [User, Auditor]
  trigger: "GET /identities/{id}/activity"
  steps:
  - Query activity_logs ordered by created_at desc, paginated
    state_transition: null
    outputs: [activity_feed]
    db_tables: [activity_logs]
    gap: false

- id: FR-IDM-017
  title: User Notifications
  actors: [User]
  trigger: "[PROPOSED] various system events across the module"
  steps:
  - Insert notifications row on qualifying event
  - Deliver via configured channel
  - Expose notification list/read-state to the user
    state_transition: null
    outputs: [notification]
    db_tables: [notifications]
    gap: true
    gap_note: "Source doc (Section 1.10 / Section 7, FR-IDM-017) lists only a heading with no trigger list. Cross-referencing FR-TEN-015 and FR-CM-015 (which do enumerate triggers for their modules) as the likely pattern: verification outcomes, document status changes, AML matches, risk-rating changes, consent events. Confirm the exact trigger list with stakeholders."

- id: FR-IDM-018
  title: Identity Status Tracking
  actors: [Compliance Platform]
  trigger: "derived — every write to account_status or verification_status"
  steps:
  - Expose combined status (account_status + verification_status) via identities row
  - Every transition on either machine inserts an identity_status_history row
    state_transition:
    machines: [identityAccountStatus, identityVerificationStatus]
    outputs: [current_status, status_history]
    db_tables: [identities, identity_status_history]
    gap: true
    gap_note: "Source doc (Section 1.11 / Section 7, FR-IDM-018) lists only a heading. No status values or transition rules were specified. This spec proposes splitting the concept into two independent machines — account_status (registration/session usability) and verification_status (KYC outcome) — since the source material conflates both under 'Identity Status' without distinguishing them. Confirm with stakeholders before implementation."

- id: FR-IDM-019
  title: Identity Audit History
  actors: [User, Auditor, Administrator]
  trigger: "every state-changing operation across Module 1"
  steps:
  - Every write above also inserts an audit_logs row (previous_state, new_state, actor)
  - Revoke UPDATE/DELETE grants on audit_logs at the DB role level to enforce immutability
    state_transition: null
    outputs: [audit_trail]
    db_tables: [audit_logs]
    gap: false
