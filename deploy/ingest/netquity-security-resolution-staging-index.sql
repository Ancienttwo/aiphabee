-- Run outside a transaction before the staging Worker live smoke.
-- Kept separate because PostgreSQL forbids CONCURRENTLY inside a transaction.

CREATE INDEX CONCURRENTLY IF NOT EXISTS serving_record_security_aliases_gin
ON aiphabee_core.serving_record
USING gin ((payload -> 'aliases') jsonb_path_ops)
WHERE entity_type = 'instrument' AND quality_state = 'PASS';
