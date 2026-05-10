    -- ============================================================
    -- Notifications table for workshop activity feed
    -- ============================================================

    CREATE TABLE public.notifications (
        id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        workshop_id UUID         NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
        type        TEXT         NOT NULL,
        title       TEXT         NOT NULL,
        body        TEXT,
        is_read     BOOLEAN      NOT NULL DEFAULT false,
        actor_id    UUID         REFERENCES public.users(id) ON DELETE SET NULL,
        actor_name  TEXT,
        metadata    JSONB        NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_notifications_workshop_date
        ON public.notifications(workshop_id, created_at DESC);

    CREATE INDEX idx_notifications_unread
        ON public.notifications(workshop_id)
        WHERE is_read = false;

    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "notifications_workshop_read"
        ON public.notifications FOR SELECT
        USING (
            workshop_id = (
                SELECT workshop_id FROM public.users WHERE id = auth.uid()
            )
        );

    CREATE POLICY "notifications_workshop_update"
        ON public.notifications FOR UPDATE
        USING (
            workshop_id = (
                SELECT workshop_id FROM public.users WHERE id = auth.uid()
            )
        );
