-- ─────────────────────────────────────────────────────────────────────────────
-- 00019_whatsapp.sql — Configuración e historial de mensajes WhatsApp Business
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Configuración por taller
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id           UUID         NOT NULL UNIQUE REFERENCES workshops(id) ON DELETE CASCADE,
    phone_number_id       VARCHAR(50),    -- de Meta Business
    access_token          TEXT,           -- token de acceso permanente (cifrado en app)
    webhook_verify_token  VARCHAR(100),
    enabled               BOOLEAN      NOT NULL DEFAULT false,
    -- Templates activos
    send_on_received      BOOLEAN      NOT NULL DEFAULT true,
    send_on_completed     BOOLEAN      NOT NULL DEFAULT true,
    send_on_delivered     BOOLEAN      NOT NULL DEFAULT true,
    send_appointment_reminder BOOLEAN  NOT NULL DEFAULT false,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whatsapp_config: workshop admin" ON whatsapp_config;
CREATE POLICY "whatsapp_config: workshop admin" ON whatsapp_config
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- 2. Log de mensajes enviados
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID          NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    repair_id       UUID          REFERENCES repairs(id) ON DELETE SET NULL,
    phone           VARCHAR(30)   NOT NULL,
    template_name   VARCHAR(100)  NOT NULL,
    payload         JSONB,
    status          TEXT          NOT NULL DEFAULT 'sent'
                        CHECK (status IN ('sent','delivered','read','failed')),
    meta_message_id TEXT,
    error_msg       TEXT,
    sent_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wam_workshop ON whatsapp_messages(workshop_id);
CREATE INDEX IF NOT EXISTS idx_wam_repair   ON whatsapp_messages(repair_id);
CREATE INDEX IF NOT EXISTS idx_wam_sent_at  ON whatsapp_messages(sent_at DESC);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whatsapp_messages: workshop access" ON whatsapp_messages;
CREATE POLICY "whatsapp_messages: workshop access" ON whatsapp_messages
    FOR ALL USING (workshop_id = get_my_workshop_id());
