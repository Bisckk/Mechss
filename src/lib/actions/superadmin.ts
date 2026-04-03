'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

// ── Types ──────────────────────────────────────────────────

export type WorkshopFormData = {
  name: string
  slug: string
  email: string
  phone: string
  city: string
  country: string
  plan_id: string
  // Admin user to create alongside the workshop
  admin_full_name: string
  admin_email: string
  admin_password: string
}

export type PlanFormData = {
  name: string
  slug: string
  description: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  max_users: number
  max_clients: number
  features: Record<string, boolean>
}

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── Workshop CRUD ──────────────────────────────────────────

export async function createWorkshop(
  fd: WorkshopFormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = createAdminClient()

  // 1. Resolve trial end date from the selected plan
  const { data: planRaw } = await supabase
    .from('plans')
    .select('trial_days')
    .eq('id', fd.plan_id)
    .single()

  const plan = planRaw as unknown as { trial_days: number } | null

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + (plan?.trial_days ?? 14))

  // 2. Create the workshop (tenant)
  const { data: workshop, error: wsErr } = await supabase
    .from('workshops')
    .insert({
      name: fd.name,
      slug: fd.slug,
      email: fd.email,
      phone: fd.phone,
      city: fd.city,
      country: fd.country,
      plan_id: fd.plan_id,
      plan_status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select('id')
    .single()

  if (wsErr || !workshop) {
    return { ok: false, error: wsErr?.message ?? 'No se pudo crear el taller.' }
  }

  // 3. Create the auth user for the initial Admin
  //    The trigger fn_handle_new_auth_user will auto-insert into public.users
  const { error: authErr } = await supabase.auth.admin.createUser({
    email: fd.admin_email,
    password: fd.admin_password,
    email_confirm: true,
    user_metadata: {
      role: 'admin' satisfies UserRole,
      workshop_id: workshop.id,
      full_name: fd.admin_full_name,
    },
  })

  if (authErr) {
    // Roll back the workshop if admin user creation fails
    await supabase.from('workshops').delete().eq('id', workshop.id)
    return { ok: false, error: `Error al crear usuario Admin: ${authErr.message}` }
  }

  revalidatePath('/superadmin/workshops')
  return { ok: true, data: { id: workshop.id } }
}

export type QuickWorkshopFormData = {
  name: string
  slug: string
  plan_id: string
}

export async function createQuickWorkshop(
  fd: QuickWorkshopFormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = createAdminClient()

  const { data: planRaw } = await supabase
    .from('plans')
    .select('trial_days')
    .eq('id', fd.plan_id)
    .single()

  const plan = planRaw as unknown as { trial_days: number } | null
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + (plan?.trial_days ?? 14))

  const { data: workshop, error } = await supabase
    .from('workshops')
    .insert({
      name: fd.name,
      slug: fd.slug,
      country: 'CO',
      plan_id: fd.plan_id,
      plan_status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select('id')
    .single()

  if (error || !workshop) {
    return { ok: false, error: error?.message ?? 'No se pudo crear el taller.' }
  }

  revalidatePath('/superadmin/workshops')
  return { ok: true, data: { id: workshop.id } }
}

export async function updateWorkshop(
  id: string,
  patch: Partial<Omit<WorkshopFormData, 'admin_full_name' | 'admin_email' | 'admin_password'>>
): Promise<ActionResult> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('workshops').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/workshops')
  return { ok: true, data: null }
}

export async function deleteWorkshop(id: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('workshops').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/workshops')
  return { ok: true, data: null }
}

export async function changeWorkshopPlan(
  workshopId: string,
  planId: string,
  status: 'active' | 'trial' | 'inactive'
): Promise<ActionResult> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('workshops')
    .update({ plan_id: planId, plan_status: status })
    .eq('id', workshopId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/workshops')
  return { ok: true, data: null }
}

export async function toggleWorkshopStatus(
  workshopId: string,
  status: 'active' | 'inactive' | 'trial'
): Promise<ActionResult> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('workshops')
    .update({ plan_status: status })
    .eq('id', workshopId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/workshops')
  return { ok: true, data: null }
}

// ── Plan CRUD ──────────────────────────────────────────────

export async function createPlan(fd: PlanFormData): Promise<ActionResult<{ id: string }>> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('plans')
    .insert({ ...fd })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/plans')
  return { ok: true, data: { id: data.id } }
}

export async function updatePlan(
  id: string,
  patch: Partial<PlanFormData>
): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('plans').update(patch).eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/plans')
  return { ok: true, data: null }
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/plans')
  return { ok: true, data: null }
}

// ── Admin users management ─────────────────────────────────

export async function suspendAdminUser(userId: string): Promise<ActionResult> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/users')
  return { ok: true, data: null }
}

export async function activateAdminUser(userId: string): Promise<ActionResult> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/users')
  return { ok: true, data: null }
}

export async function sendPasswordReset(email: string): Promise<ActionResult> {
  const supabase = createAdminClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/reset-password`,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: null }
}

export async function setTempPasswordAction(
  userId: string,
  password: string
): Promise<ActionResult> {
  if (password.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    app_metadata: { must_change_password: true },
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: null }
}

// ── Platform accounting ────────────────────────────────────

export type PlatformEntryData = {
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  workshop_id?: string
  payment_method?: string
  reference?: string
  transaction_date: string
}

export async function createPlatformEntry(
  fd: PlatformEntryData
): Promise<ActionResult<{ id: string }>> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('platform_accounting')
    .insert({ ...fd })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/accounting')
  return { ok: true, data: { id: data.id } }
}

// ── Platform accounting delete ──────────────────────────────

export async function deletePlatformEntry(id: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('platform_accounting').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/superadmin/accounting')
  return { ok: true, data: null }
}

// ── Create Admin User ──────────────────────────────────────

export type AdminUserFormData = {
  full_name: string
  email: string
  password: string
  workshop_id: string
}

export async function createAdminUser(
  fd: AdminUserFormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = createAdminClient()

  const { data, error: authErr } = await supabase.auth.admin.createUser({
    email: fd.email,
    password: fd.password,
    email_confirm: true,
    user_metadata: {
      role: 'admin' satisfies UserRole,
      workshop_id: fd.workshop_id,
      full_name: fd.full_name,
    },
  })

  if (authErr) {
    return { ok: false, error: `Error al crear usuario Admin: ${authErr.message}` }
  }

  revalidatePath('/superadmin/users')
  return { ok: true, data: { id: data.user.id } }
}

export type UpdateAdminUserFormData = {
  full_name: string
  email: string
  workshop_id: string
}

export async function updateAdminUser(
  userId: string,
  fd: UpdateAdminUserFormData
): Promise<ActionResult> {
  const supabase = createAdminClient()

  // Update Auth user (email and metadata)
  const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
    email: fd.email,
    user_metadata: {
      role: 'admin',
      workshop_id: fd.workshop_id,
      full_name: fd.full_name,
    },
  })

  if (authErr) {
    return { ok: false, error: `Error al actualizar auth: ${authErr.message}` }
  }

  // Update Users table
  const { error: dbErr } = await supabase
    .from('users')
    .update({
      full_name: fd.full_name,
      email: fd.email,
      workshop_id: fd.workshop_id,
    })
    .eq('id', userId)

  if (dbErr) {
    return { ok: false, error: `Error al actualizar perfil: ${dbErr.message}` }
  }

  revalidatePath('/superadmin/users')
  return { ok: true, data: null }
}
