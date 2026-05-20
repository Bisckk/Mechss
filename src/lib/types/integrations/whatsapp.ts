// WhatsApp Business Cloud API — Meta
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

// ── Webhook inbound ─────────────────────────────────────────

export interface WhatsAppWebhookPayload {
    object: 'whatsapp_business_account'
    entry:  WhatsAppEntry[]
}

export interface WhatsAppEntry {
    id:      string
    changes: WhatsAppChange[]
}

export interface WhatsAppChange {
    field: 'messages'
    value: WhatsAppValue
}

export interface WhatsAppValue {
    messaging_product: 'whatsapp'
    metadata:  WhatsAppMetadata
    contacts?: WhatsAppContact[]
    messages?: WhatsAppInboundMessage[]
    statuses?: WhatsAppStatus[]
    errors?:   WhatsAppError[]
}

export interface WhatsAppMetadata {
    display_phone_number: string
    phone_number_id:      string
}

export interface WhatsAppContact {
    profile: { name: string }
    wa_id:   string
}

// ── Mensajes entrantes ──────────────────────────────────────

export type WhatsAppMessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'button' | 'interactive' | 'order' | 'unknown'

export interface WhatsAppInboundMessage {
    id:        string
    from:      string
    timestamp: string
    type:      WhatsAppMessageType
    text?:     { body: string }
    image?:    WhatsAppMedia
    audio?:    WhatsAppMedia
    video?:    WhatsAppMedia
    document?: WhatsAppMedia & { filename?: string }
    button?:   { payload: string; text: string }
    interactive?: WhatsAppInteractiveReply
    context?:  { from: string; id: string }
}

export interface WhatsAppMedia {
    id:        string
    mime_type: string
    sha256:    string
    caption?:  string
}

export interface WhatsAppInteractiveReply {
    type:         'button_reply' | 'list_reply'
    button_reply?: { id: string; title: string }
    list_reply?:   { id: string; title: string; description?: string }
}

// ── Status de mensajes enviados ─────────────────────────────

export type WhatsAppStatusType = 'sent' | 'delivered' | 'read' | 'failed'

export interface WhatsAppStatus {
    id:           string
    status:       WhatsAppStatusType
    timestamp:    string
    recipient_id: string
    conversation?: {
        id:                  string
        expiration_timestamp?: string
        origin:              { type: string }
    }
    pricing?: {
        billable:       boolean
        pricing_model:  string
        category:       string
    }
    errors?: WhatsAppError[]
}

export interface WhatsAppError {
    code:       number
    title:      string
    message:    string
    error_data?: { details: string }
}

// ── Mensajes salientes ──────────────────────────────────────

export type WhatsAppOutboundType = 'text' | 'template' | 'interactive' | 'image' | 'document'

export interface WhatsAppSendTextPayload {
    messaging_product: 'whatsapp'
    recipient_type:    'individual'
    to:                string
    type:              'text'
    text: {
        preview_url?: boolean
        body:         string
    }
}

export interface WhatsAppSendTemplatePayload {
    messaging_product: 'whatsapp'
    recipient_type:    'individual'
    to:                string
    type:              'template'
    template: {
        name:     string
        language: { code: string }
        components?: WhatsAppTemplateComponent[]
    }
}

export interface WhatsAppTemplateComponent {
    type:       'header' | 'body' | 'button'
    sub_type?:  'quick_reply' | 'url'
    index?:     number
    parameters: WhatsAppTemplateParameter[]
}

export type WhatsAppTemplateParameter =
    | { type: 'text';     text: string }
    | { type: 'currency'; currency: { fallback_value: string; code: string; amount_1000: number } }
    | { type: 'date_time'; date_time: { fallback_value: string } }
    | { type: 'image';    image: { link: string } }
    | { type: 'payload';  payload: string }

// ── Respuesta de la API ─────────────────────────────────────

export interface WhatsAppSendResponse {
    messaging_product: 'whatsapp'
    contacts:          Array<{ input: string; wa_id: string }>
    messages:          Array<{ id: string; message_status?: string }>
}

export interface WhatsAppSendErrorResponse {
    error: {
        message:    string
        type:       string
        code:       number
        fbtrace_id: string
    }
}
