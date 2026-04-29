import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { user_id, parent_id } = await req.json()

    // Delete student auth user
    if (user_id) {
      await supabaseAdmin.auth.admin.deleteUser(user_id)
    }

    // Delete parent auth user if provided
    if (parent_id) {
      await supabaseAdmin.auth.admin.deleteUser(parent_id)
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message })
  }
}