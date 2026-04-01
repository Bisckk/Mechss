// ============================================================
// Supabase Database types — non-circular, flat definitions
// ============================================================

export type UserRole      = 'superadmin' | 'admin' | 'receptionist' | 'mechanic'
export type PlanStatus    = 'active' | 'inactive' | 'trial'
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type RepairStatus  = 'received' | 'diagnosing' | 'waiting_parts' | 'in_repair' | 'quality_check' | 'ready' | 'delivered'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'
export type AccountingType = 'income' | 'expense'

// ── Standalone Row types (no self-reference) ────────────────

type PlanRow = {
  id: string; name: string; slug: string; description: string | null
  price_monthly: number; price_yearly: number; trial_days: number
  max_users: number; max_clients: number; features: Record<string, boolean>
  is_active: boolean; created_at: string; updated_at: string
}

type WorkshopRow = {
  id: string; plan_id: string | null; name: string; slug: string
  email: string | null; phone: string | null; address: string | null
  city: string | null; country: string; logo_url: string | null
  plan_status: PlanStatus; trial_ends_at: string | null
  subscription_ends_at: string | null; settings: Record<string, unknown>
  landing_page_config: Record<string, unknown>; is_active: boolean
  created_at: string; updated_at: string
}

type UserRow = {
  id: string; workshop_id: string | null; role: UserRole
  full_name: string; email: string; phone: string | null
  avatar_url: string | null; is_active: boolean
  created_at: string; updated_at: string
}

type ClientRow = {
  id: string; workshop_id: string; full_name: string
  email: string | null; phone: string | null; address: string | null
  notes: string | null; is_active: boolean; created_at: string; updated_at: string
}

type AppointmentRow = {
  id: string; workshop_id: string; client_id: string; mechanic_id: string | null
  title: string; description: string | null; scheduled_at: string
  duration_minutes: number; status: AppointmentStatus; notes: string | null
  created_by: string | null; created_at: string; updated_at: string
}

type InventoryRow = {
  id: string; workshop_id: string; name: string; sku: string | null
  description: string | null; category: string | null; unit: string
  quantity: number; min_quantity: number; cost_price: number; sale_price: number
  supplier: string | null; is_active: boolean; created_at: string; updated_at: string
}

type RepairRow = {
  id: string; workshop_id: string; client_id: string; appointment_id: string | null
  mechanic_id: string | null; tracking_code: string; vehicle_brand: string | null
  vehicle_model: string | null; vehicle_year: number | null; vehicle_plate: string | null
  vehicle_vin: string | null; mileage: number | null; reported_issue: string
  diagnosis: string | null; status: RepairStatus; estimated_cost: number | null
  final_cost: number | null; payment_status: PaymentStatus
  estimated_completion: string | null; completed_at: string | null
  client_notified_at: string | null; created_at: string; updated_at: string
}

type RepairUpdateRow = {
  id: string; repair_id: string; user_id: string; status: RepairStatus
  notes: string | null; photos: string[]; is_client_visible: boolean; created_at: string
}

type AccountingRow = {
  id: string; workshop_id: string; repair_id: string | null; user_id: string | null
  type: AccountingType; category: string; description: string; amount: number
  payment_method: string | null; reference: string | null
  transaction_date: string; created_at: string; updated_at: string
}

type PlatformAccountingRow = {
  id: string; type: AccountingType; category: string; description: string
  amount: number; workshop_id: string | null; payment_method: string | null
  reference: string | null; transaction_date: string; created_at: string; updated_at: string
}

// ── Database interface ──────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      plans: {
        Row:    PlanRow
        Insert: Omit<PlanRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PlanRow, 'id'>>
      }
      workshops: {
        Row:    WorkshopRow
        Insert: Omit<WorkshopRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<WorkshopRow, 'id'>>
      }
      users: {
        Row:    UserRow
        Insert: Omit<UserRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserRow, 'id'>>
      }
      clients: {
        Row:    ClientRow
        Insert: Omit<ClientRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<ClientRow, 'id'>>
      }
      appointments: {
        Row:    AppointmentRow
        Insert: Omit<AppointmentRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<AppointmentRow, 'id'>>
      }
      inventory: {
        Row:    InventoryRow
        Insert: Omit<InventoryRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<InventoryRow, 'id'>>
      }
      repairs: {
        Row:    RepairRow
        Insert: Omit<RepairRow, 'id' | 'tracking_code' | 'created_at' | 'updated_at'> & { id?: string; tracking_code?: string }
        Update: Partial<Omit<RepairRow, 'id'>>
      }
      repair_updates: {
        Row:    RepairUpdateRow
        Insert: Omit<RepairUpdateRow, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<RepairUpdateRow, 'id'>>
      }
      accounting: {
        Row:    AccountingRow
        Insert: Omit<AccountingRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<AccountingRow, 'id'>>
      }
      platform_accounting: {
        Row:    PlatformAccountingRow
        Insert: Omit<PlatformAccountingRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<PlatformAccountingRow, 'id'>>
      }
    }
    Views: Record<string, never>
    Enums: {
      user_role:          UserRole
      plan_status:        PlanStatus
      appointment_status: AppointmentStatus
      repair_status:      RepairStatus
      payment_status:     PaymentStatus
      accounting_type:    AccountingType
    }
    Functions: {
      get_my_role:        { Args: Record<never, never>; Returns: UserRole }
      get_my_workshop_id: { Args: Record<never, never>; Returns: string }
    }
    CompositeTypes: Record<string, never>
  }
}
