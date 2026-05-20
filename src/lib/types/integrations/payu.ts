// PayU — Pasarela de pagos LatAm
// Docs: https://developers.payu.com

// ── Enums de dominio ────────────────────────────────────────

export type PayUTransactionState =
    | 'APPROVED'
    | 'DECLINED'
    | 'ERROR'
    | 'PENDING'
    | 'EXPIRED'

// state_pol numérico recibido en IPN
export const PAYU_STATE_POL: Record<string, PayUTransactionState> = {
    '4':   'APPROVED',
    '6':   'DECLINED',
    '5':   'EXPIRED',
    '7':   'PENDING',
    '104': 'ERROR',
} as const

export type PayUPaymentMethodType =
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'PSE'
    | 'BALOTO'
    | 'REFERENCED'
    | 'BANK_REFERENCED'
    | 'DAVIPLATA'

// ── IPN (Instant Payment Notification) ─────────────────────
// PayU envía application/x-www-form-urlencoded, no JSON

export interface PayUIPNPayload {
    merchant_id:          string
    state_pol:            string
    risk:                 string
    response_code_pol:    string
    reference_sale:       string
    reference_pol:        string
    description:          string
    currency:             string
    amount:               string
    tax:                  string
    additional_value:     string
    transaction_date:     string
    payment_method:       string
    payment_method_type:  string
    installments_number:  string
    sign:                 string
    test:                 '0' | '1'
    response_message_pol: string
    transaction_id:       string
    // Opcionales según método de pago
    email_buyer?:         string
    phone?:               string
    office_phone?:        string
    billing_address?:     string
    billing_city?:        string
    billing_country?:     string
    shipping_address?:    string
    shipping_city?:       string
    shipping_country?:    string
    cc_holder?:           string
    cc_number?:           string
    authorization_code?:  string
    bank_id?:             string
    pse_bank?:            string
    pse_reference1?:      string
    pse_reference2?:      string
    pse_reference3?:      string
    error_code_bank?:     string
    error_message_bank?:  string
    exchange_rate?:       string
    extra1?:              string
    extra2?:              string
    extra3?:              string
    nickname_buyer?:      string
    customer_number?:     string
    attempts?:            string
}

// ── API de pago (crear sesión de cobro) ─────────────────────

export interface PayUCreatePaymentPayload {
    language:       string
    command:        'SUBMIT_TRANSACTION'
    merchant: {
        apiLogin:   string
        apiKey:     string
    }
    transaction: {
        order: PayUOrder
        creditCard?:    PayUCreditCard
        type:           'AUTHORIZATION_AND_CAPTURE' | 'AUTHORIZATION'
        paymentMethod:  string
        paymentCountry: string
        deviceSessionId: string
        ipAddress:      string
        cookie?:        string
        userAgent?:     string
    }
    test: boolean
}

export interface PayUOrder {
    accountId:      string
    referenceCode:  string
    description:    string
    language:       string
    signature:      string
    notifyUrl?:     string
    additionalValues: {
        TX_VALUE: { value: number; currency: string }
        TX_TAX?:  { value: number; currency: string }
    }
    buyer?: PayUBuyer
}

export interface PayUBuyer {
    merchantBuyerId: string
    fullName:        string
    emailAddress:    string
    contactPhone?:   string
    dniNumber?:      string
    shippingAddress?: PayUAddress
}

export interface PayUCreditCard {
    number:           string
    securityCode:     string
    expirationDate:   string
    name:             string
    processWithoutCvv2?: boolean
}

export interface PayUAddress {
    street1:   string
    street2?:  string
    city:      string
    state:     string
    country:   string
    postalCode?: string
    phone?:    string
}

// ── Respuesta de la API ─────────────────────────────────────

export interface PayUTransactionResponse {
    code:    'SUCCESS' | 'ERROR'
    error?:  string
    transactionResponse?: {
        orderId:             number
        transactionId:       string
        state:               PayUTransactionState
        paymentNetworkResponseCode?: string
        paymentNetworkResponseErrorMessage?: string
        trazabilityCode?:    string
        authorizationCode?:  string
        pendingReason?:      string
        responseCode?:       string
        errorCode?:          string
        responseMessage?:    string
        transactionDate?:    string
        transactionTime?:    string
        operationDate?:      string
        extraParameters?:    Record<string, string>
    }
}
