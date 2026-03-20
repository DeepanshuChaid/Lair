-- +goose up
ALTER TABLE auth_providers
ADD CONSTRAINT unique_user_provider UNIQUE (user_id, provider);

-- +goose-down