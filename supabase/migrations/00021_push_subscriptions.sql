-- Push Subscriptions — stores Web Push subscription objects per user/device
-- One row per (user_id, endpoint) pair — a user can subscribe from multiple devices

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
    workshop_id uuid            NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    user_id     uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint    text            NOT NULL,
    p256dh      text            NOT NULL,
    auth        text            NOT NULL,
    created_at  timestamptz     DEFAULT now() NOT NULL,
    UNIQUE (user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions only
CREATE POLICY "push_sub_own" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Index for efficient workshop-wide sends
CREATE INDEX idx_push_subs_workshop ON push_subscriptions (workshop_id);
