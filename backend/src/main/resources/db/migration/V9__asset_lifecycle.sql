ALTER TABLE assets ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assets ADD COLUMN active_asset_tag VARCHAR(100);

UPDATE assets SET active_asset_tag = asset_tag;

ALTER TABLE assets DROP CONSTRAINT uq_assets_tag;

CREATE UNIQUE INDEX uq_assets_active_tag ON assets (organization_id, active_asset_tag);

ALTER TABLE asset_assignments ADD COLUMN open_asset_id UUID;

UPDATE asset_assignments SET open_asset_id = asset_id WHERE returned_at IS NULL;

CREATE UNIQUE INDEX uq_asset_assignment_open ON asset_assignments (open_asset_id);

CREATE INDEX idx_assets_org_archived ON assets (organization_id, archived_at);

CREATE TABLE asset_events (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    asset_id        UUID NOT NULL REFERENCES assets(id),
    event_type      VARCHAR(40) NOT NULL,
    occurred_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    actor_user_id   UUID,
    field_name      VARCHAR(50),
    previous_value  VARCHAR(1000),
    new_value       VARCHAR(1000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE INDEX idx_asset_events_asset_time ON asset_events (asset_id, occurred_at);
