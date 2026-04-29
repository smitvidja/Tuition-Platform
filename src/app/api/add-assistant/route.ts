import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Create assistant auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'assistant' }
    })

    if (error) {
      return NextResponse.json({ success: false, message: error.message })
    }

    // Insert profile manually to ensure role is set correctly
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      role: 'assistant'
    })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message })
  }
}