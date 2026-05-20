// Wompi — Pasarela de pagos Colombia
// Docs: https://docs.wompi.co

// ── Enums de dominio ────────────────────────────────────────

export type WompiTransactionStatus =
    | 'APPROVED'
    | 'DECLINED'
    | 'VOIDED'
    | 'ERROR'
    | 'PENDING'

export type WompiPaymentMethodType =
    | 'CARD'
    | 'NEQUI'
    | 'PSE'
    | 'BANCOLOMBIA_TRANSFER'
    | 'BANCOLOMBIA_QR'
    | 'EFECTY'
    | 'DAVIPLATA'

export type WompiCurrency = 'COP'

export type WompiEnvironment = 'prod' | 'test'

// ── Webhook inbound ─────────────────────────────────────────

export interface WompiWebhookEvent {
    event:       'transaction.updated' | 'nequi_token.updated' | 'payment_link.paid'
    data:        WompiWebhookData
    environment: WompiEnvironment
    signature:   WompiSignature
    timestamp:   number
    sent_at:     string
}

export interface WompiWebhookData {
    transaction: WompiTransaction
}

export interface WompiSignature {
    checksum:   string
    properties: string[]
}

// ── Entidad Transaction ─────────────────────────────────────

export interface WompiTransaction {
    id:                   string
    created_at:           string
    finalized_at:         string | null
    amount_in_cents:      number
    reference:            string
    currency:             WompiCurrency
    payment_method_type:  WompiPaymentMethodType
    payment_method:       WompiPaymentMethodDetail
    status:               WompiTransactionStatus
    status_message:       string | null
    billing_data:         WompiBillingData | null
    shipping_address:     WompiAddress | null
    redirect_url:         string | null
    payment_source_id:    number | null
    payment_link_id:      string | null
    customer_data:        WompiCustomerData | null
    taxes:                WompiTax[]
    merchant:             WompiMerchant
}

export interface WompiPaymentMethodDetail {
    type:              WompiPaymentMethodType
    extra:             Record<string, unknown>
    installments?:     number
    token?:            string
    phone_number?:     string
    sandbox_status?:   WompiTransactionStatus
}

export interface WompiBillingData {
    legal_id:       string
    legal_id_type:  string
}

export interface WompiCustomerData {
    phone_number:   string
    full_name:      string
    legal_id?:      string
    legal_id_type?: string
}

export interface WompiAddress {
    address_line_1: string
    address_line_2?: string
    country:        string
    region:         string
    city:           string
    name:           string
    phone_number:   string
    postal_code?:   string
}

export interface WompiTax {
    type:          string
    amount_in_cents: number
}

export interface WompiMerchant {
    name:         string
    legal_name:   string
    contact_name: string
    phone_number: string
    logo_url:     string | null
    legal_id:     string
    email:        string
}

// ── Payment Link API ────────────────────────────────────────

export interface WompiCreatePaymentLinkPayload {
    name:                string
    description?:        string
    single_use:          boolean
    collect_shipping:    boolean
    currency:            WompiCurrency
    amount_in_cents:     number
    redirect_url?:       string
    customer_data?:      Partial<WompiCustomerData>
}

export interface WompiCreatePaymentLinkResponse {
    data: {
        id:              string
        name:            string
        payment_link_url: string
        status:          'ACTIVE' | 'INACTIVE'
    }
}

// ── Respuestas genéricas ────────────────────────────────────

export interface WompiApiError {
    error: {
        type:     string
        reason:   string
        messages: Record<string, string[]>
    }
}
